'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { closePoll } from '@/modules/polls/actions'
import { emitActivity } from '@/lib/events'
import { uniqueSlug } from '@/lib/slugify'

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

export async function createProjectPoll(
  slug: string,
  locale: string,
  input: CreatePollInput,
): Promise<PollsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  const questions = (input.questions ?? [])
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

    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi]
      const question = await payload.create({
        collection: 'poll-questions',
        data: {
          poll: poll.id,
          text: q.text,
          order: qi,
          type: q.type as 'single' | 'multiple' | 'text' | 'scale',
        },
        overrideAccess: true,
      })
      if (q.type === 'single' || q.type === 'multiple') {
        for (let oi = 0; oi < q.options.length; oi++) {
          await payload.create({
            collection: 'poll-options',
            data: { question: question.id, text: q.options[oi], order: oi },
            overrideAccess: true,
          })
        }
      }
    }

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

    const questions = await payload.find({
      collection: 'poll-questions',
      where: { poll: { equals: pollId } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })

    await payload.delete({ collection: 'poll-votes', where: { poll: { equals: pollId } }, overrideAccess: true })
    for (const q of questions.docs) {
      await payload.delete({ collection: 'poll-options', where: { question: { equals: q.id } }, overrideAccess: true })
    }
    await payload.delete({ collection: 'poll-questions', where: { poll: { equals: pollId } }, overrideAccess: true })
    await payload.delete({ collection: 'polls', id: pollId, overrideAccess: true })
  } catch {
    return { error: 'Umfrage konnte nicht gelöscht werden.' }
  }

  revalidatePolls(locale, slug)
  return { ok: true }
}
