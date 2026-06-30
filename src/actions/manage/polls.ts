'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { closePoll } from '@/modules/polls/actions'
import { emitActivity } from '@/lib/events'
import { uniqueSlug } from '@/lib/slugify'
import { computeResults } from '@/lib/poll-results'

export type PollsActionState = { error?: string; ok?: boolean }

const QUESTION_TYPES = new Set(['single', 'multiple', 'text', 'scale'])
const VISIBILITIES = new Set(['PUBLIC', 'INTERNAL', 'TEAM'])

export interface PollQuestionInput {
  text: string
  type: string
  options: string[]
}

export interface CreatePollInput {
  title: string
  description?: string
  closesAt?: string
  visibility?: string
  allowAnonymous?: boolean
  showLiveResults?: boolean
  questions: PollQuestionInput[]
}

function revalidatePolls(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/inhalte/polls`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
}

/** Load a poll and verify it belongs to the managed project. */
async function getProjectPoll(payload: Payload, projectId: string, pollId: string) {
  const poll = await payload.findByID({ collection: 'polls', id: pollId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!poll) return null
  const pid = typeof poll.project === 'object' ? poll.project?.id : poll.project
  return String(pid) === String(projectId) ? poll : null
}

interface CleanQuestion { text: string; type: string; options: string[] }

/** Validate + normalize question inputs. Returns the cleaned list or an error. */
function validateQuestions(input: PollQuestionInput[]): { questions: CleanQuestion[] } | { error: string } {
  const questions = (input ?? [])
    .map((q) => ({
      text: q.text.trim(),
      type: QUESTION_TYPES.has(q.type) ? q.type : 'single',
      options: (q.options ?? []).map((o) => o.trim()).filter(Boolean),
    }))
    .filter((q) => q.text.length > 0)

  if (questions.length === 0) return { error: 'Mindestens eine Frage angeben.' }
  for (const q of questions) {
    if ((q.type === 'single' || q.type === 'multiple') && q.options.length < 2) {
      return { error: `Frage „${q.text}" braucht mindestens zwei Antwortoptionen.` }
    }
  }
  return { questions }
}

/** Create poll-questions (+ options for choice types) for a poll, in order. */
async function writeQuestions(payload: Payload, pollId: string | number, questions: CleanQuestion[]) {
  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi]
    const question = await payload.create({
      collection: 'poll-questions',
      data: { poll: String(pollId), text: q.text, order: qi, type: q.type as 'single' | 'multiple' | 'text' | 'scale' },
      overrideAccess: true,
    })
    if (q.type === 'single' || q.type === 'multiple') {
      for (let oi = 0; oi < q.options.length; oi++) {
        await payload.create({ collection: 'poll-options', data: { question: question.id, text: q.options[oi], order: oi }, overrideAccess: true })
      }
    }
  }
}

/** Delete a poll's questions, options and votes (not the poll itself). */
async function deleteQuestionTree(payload: Payload, pollId: string) {
  const qs = await payload.find({ collection: 'poll-questions', where: { poll: { equals: pollId } }, limit: 200, depth: 0, overrideAccess: true })
  await payload.delete({ collection: 'poll-votes', where: { poll: { equals: pollId } }, overrideAccess: true })
  for (const q of qs.docs) {
    await payload.delete({ collection: 'poll-options', where: { question: { equals: q.id } }, overrideAccess: true })
  }
  await payload.delete({ collection: 'poll-questions', where: { poll: { equals: pollId } }, overrideAccess: true })
}

export async function createProjectPoll(
  slug: string,
  locale: string,
  input: CreatePollInput,
): Promise<PollsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  const validated = validateQuestions(input.questions)
  if ('error' in validated) return { error: validated.error }

  let closesAt: string | undefined
  if (input.closesAt) {
    const d = new Date(input.closesAt)
    if (Number.isNaN(d.getTime())) return { error: 'Ungültiges Enddatum.' }
    closesAt = d.toISOString()
  }

  try {
    const payload = await getPayload({ config })

    const poll = await payload.create({
      collection: 'polls',
      data: {
        title,
        slug: uniqueSlug(title, 'umfrage'),
        description: input.description?.trim() || undefined,
        status: 'draft',
        allowAnonymous: !!input.allowAnonymous,
        showLiveResults: !!input.showLiveResults,
        closesAt,
        visibility: (VISIBILITIES.has(input.visibility ?? '') ? input.visibility : 'INTERNAL') as 'PUBLIC' | 'INTERNAL' | 'TEAM',
        author: ctx.user.id,
        project: ctx.project.id,
      },
      overrideAccess: true,
    })

    await writeQuestions(payload, poll.id, validated.questions)

    await emitActivity({
      type: 'poll.created',
      userId: String(ctx.user.id),
      projectId: ctx.project.id,
      reference: { collection: 'polls', id: String(poll.id) },
    })
  } catch {
    return { error: 'Umfrage konnte nicht erstellt werden.' }
  }

  revalidatePolls(locale, slug)
  return { ok: true }
}

/** draft → active. Closing goes through the module's closePoll (activity + notification). */
export async function setPollStatus(
  slug: string,
  locale: string,
  pollId: string,
  status: 'active' | 'closed',
): Promise<PollsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    const poll = await getProjectPoll(payload, ctx.project.id, pollId)
    if (!poll) return { error: 'Umfrage nicht gefunden.' }

    if (status === 'closed') {
      await closePoll(ctx.user, pollId, ctx.project.id)
    } else {
      await payload.update({ collection: 'polls', id: pollId, data: { status: 'active' }, overrideAccess: true })
      await emitActivity({
        type: 'poll.activated',
        userId: String(ctx.user.id),
        projectId: ctx.project.id,
        reference: { collection: 'polls', id: pollId },
      })
    }
  } catch {
    return { error: 'Status konnte nicht geändert werden.' }
  }

  revalidatePolls(locale, slug)
  return { ok: true }
}

/** Delete a poll including its questions, options and votes. */
export async function deleteProjectPoll(
  slug: string,
  locale: string,
  pollId: string,
): Promise<PollsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    const poll = await getProjectPoll(payload, ctx.project.id, pollId)
    if (!poll) return { error: 'Umfrage nicht gefunden.' }

    await deleteQuestionTree(payload, pollId)
    await payload.delete({ collection: 'polls', id: pollId, overrideAccess: true })
  } catch {
    return { error: 'Umfrage konnte nicht gelöscht werden.' }
  }

  revalidatePolls(locale, slug)
  return { ok: true }
}

/** Edit a poll while it is still a draft. Replaces questions/options wholesale. */
export async function editPollDraft(slug: string, locale: string, pollId: string, input: CreatePollInput): Promise<PollsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }
  const validated = validateQuestions(input.questions)
  if ('error' in validated) return { error: validated.error }

  let closesAt: string | null = null
  if (input.closesAt) {
    const d = new Date(input.closesAt)
    if (Number.isNaN(d.getTime())) return { error: 'Ungültiges Enddatum.' }
    closesAt = d.toISOString()
  }

  try {
    const payload = await getPayload({ config })
    const poll = await getProjectPoll(payload, ctx.project.id, pollId)
    if (!poll) return { error: 'Umfrage nicht gefunden.' }
    if ((poll as { status?: string }).status !== 'draft') return { error: 'Nur Entwürfe können bearbeitet werden.' }

    await payload.update({
      collection: 'polls',
      id: pollId,
      data: {
        title,
        description: input.description?.trim() || null,
        allowAnonymous: !!input.allowAnonymous,
        showLiveResults: !!input.showLiveResults,
        closesAt,
        visibility: (VISIBILITIES.has(input.visibility ?? '') ? input.visibility : 'INTERNAL') as 'PUBLIC' | 'INTERNAL' | 'TEAM',
      },
      overrideAccess: true,
    })

    await deleteQuestionTree(payload, pollId)
    await writeQuestions(payload, pollId, validated.questions)
  } catch {
    return { error: 'Umfrage konnte nicht gespeichert werden.' }
  }

  revalidatePolls(locale, slug)
  return { ok: true }
}

/** Full draft data for prefilling the edit form. */
export async function getPollEditData(slug: string, pollId: string): Promise<{ error: string } | { data: CreatePollInput }> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  const payload = await getPayload({ config })
  const poll = await getProjectPoll(payload, ctx.project.id, pollId)
  if (!poll) return { error: 'Umfrage nicht gefunden.' }

  const p = poll as { title?: string; description?: string; closesAt?: string | null; visibility?: string; allowAnonymous?: boolean; showLiveResults?: boolean }
  const [questionsRes, optionsRes] = await Promise.all([
    payload.find({ collection: 'poll-questions', where: { poll: { equals: pollId } }, sort: 'order', limit: 500, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'poll-options', where: {}, sort: 'order', limit: 2000, depth: 0, overrideAccess: true }),
  ])
  const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

  const questions: PollQuestionInput[] = questionsRes.docs.map((q) => {
    const qid = String((q as { id: unknown }).id)
    const options = optionsRes.docs
      .filter((o) => relId((o as { question?: unknown }).question) === qid)
      .map((o) => String((o as { text?: string }).text ?? ''))
    return { text: String((q as { text?: string }).text ?? ''), type: String((q as { type?: string }).type ?? 'single'), options }
  })

  return {
    data: {
      title: p.title ?? '',
      description: p.description ?? '',
      closesAt: p.closesAt ?? undefined,
      visibility: p.visibility ?? 'INTERNAL',
      allowAnonymous: !!p.allowAnonymous,
      showLiveResults: !!p.showLiveResults,
      questions,
    },
  }
}

// ─── Results ────────────────────────────────────────────────────────────────

export async function getPollResults(slug: string, pollId: string): Promise<{ error: string } | { results: import('@/lib/poll-results').PollResults }> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  const payload = await getPayload({ config })
  if (!(await getProjectPoll(payload, ctx.project.id, pollId))) return { error: 'Umfrage nicht gefunden.' }
  return { results: await computeResults(payload, pollId) }
}

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Long-format CSV: Frage, Typ, Antwort, Anzahl. */
export async function exportPollCsv(slug: string, pollId: string): Promise<{ error: string } | { filename: string; csv: string }> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  const payload = await getPayload({ config })
  const poll = await getProjectPoll(payload, ctx.project.id, pollId)
  if (!poll) return { error: 'Umfrage nicht gefunden.' }

  const results = await computeResults(payload, pollId)
  const rows: string[] = [['Frage', 'Typ', 'Antwort', 'Anzahl'].join(';')]
  for (const q of results.questions) {
    if (q.type === 'single' || q.type === 'multiple') {
      for (const o of q.options) rows.push([q.text, q.type, o.text, o.count].map(csvCell).join(';'))
    } else if (q.type === 'scale' && q.scale) {
      for (const [val, count] of Object.entries(q.scale.distribution)) rows.push([q.text, 'scale', val, count].map(csvCell).join(';'))
      rows.push([q.text, 'scale', `Durchschnitt: ${q.scale.average.toFixed(2)}`, q.scale.count].map(csvCell).join(';'))
    } else if (q.type === 'text') {
      for (const a of q.textAnswers) rows.push([q.text, 'text', a, 1].map(csvCell).join(';'))
    }
  }

  const title = String((poll as { slug?: string }).slug ?? 'umfrage')
  return { filename: `${title}-ergebnisse.csv`, csv: rows.join('\n') }
}
