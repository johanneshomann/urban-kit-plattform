'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import type { Payload } from 'payload'
import { getUser } from '@/lib/auth/getUser'
import { getViewerTier, canView, type Visibility } from '@/lib/visibility'

export type VoteState = { error?: string; ok?: boolean }

export interface PollAnswer {
  questionId: string
  optionIds?: string[]
  textAnswer?: string
  scaleAnswer?: number
}

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
const cookieKey = (pollId: string) => `pollvoted-${pollId}`

async function projectBySlug(payload: Payload, slug: string) {
  const res = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  return res.docs[0] as { id: string } | undefined
}

export async function submitPollVote(slug: string, locale: string, pollId: string, answers: PollAnswer[]): Promise<VoteState> {
  try {
    const payload = await getPayload({ config })
    const project = await projectBySlug(payload, slug)
    if (!project) return { error: 'Projekt nicht gefunden.' }

    const poll = await payload.findByID({ collection: 'polls', id: pollId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!poll || relId((poll as { project?: unknown }).project) !== String(project.id)) return { error: 'Umfrage nicht gefunden.' }
    const pl = poll as { status?: string; visibility?: Visibility; allowAnonymous?: boolean }
    if (pl.status !== 'active') return { error: 'Diese Umfrage ist nicht aktiv.' }

    const user = await getUser()
    const tier = await getViewerTier(payload, user ? String(user.id) : null, project.id)
    if (!canView(tier, pl.visibility)) return { error: 'Umfrage nicht verfügbar.' }
    if (!user && !pl.allowAnonymous) return { error: 'Bitte melde dich an, um abzustimmen.' }

    const cookieStore = await cookies()

    // Dedup
    if (user) {
      const existing = await payload.find({ collection: 'poll-votes', where: { and: [{ poll: { equals: pollId } }, { user: { equals: user.id } }] }, limit: 1, depth: 0, overrideAccess: true })
      if (existing.totalDocs > 0) return { error: 'Du hast bereits abgestimmt.' }
    } else if (cookieStore.get(cookieKey(pollId))?.value) {
      return { error: 'Du hast bereits abgestimmt.' }
    }

    // Load questions to validate answers
    const questionsRes = await payload.find({ collection: 'poll-questions', where: { poll: { equals: pollId } }, limit: 500, depth: 0, overrideAccess: true })
    const qById = new Map(questionsRes.docs.map((q) => [String((q as { id: unknown }).id), q as { type?: string }]))

    interface VoteRow { poll: string; question: string; user?: string; option?: string; textAnswer?: string; scaleAnswer?: number }
    const rows: VoteRow[] = []
    for (const a of answers) {
      const q = qById.get(a.questionId)
      if (!q) continue
      const base: VoteRow = { poll: pollId, question: a.questionId, ...(user ? { user: String(user.id) } : {}) }
      if (q.type === 'single' && a.optionIds?.[0]) {
        rows.push({ ...base, option: a.optionIds[0] })
      } else if (q.type === 'multiple' && a.optionIds?.length) {
        for (const oid of a.optionIds) rows.push({ ...base, option: oid })
      } else if (q.type === 'text' && a.textAnswer?.trim()) {
        rows.push({ ...base, textAnswer: a.textAnswer.trim().slice(0, 2000) })
      } else if (q.type === 'scale' && typeof a.scaleAnswer === 'number' && a.scaleAnswer >= 1 && a.scaleAnswer <= 5) {
        rows.push({ ...base, scaleAnswer: a.scaleAnswer })
      }
    }
    if (rows.length === 0) return { error: 'Bitte beantworte mindestens eine Frage.' }

    for (const data of rows) {
      await payload.create({ collection: 'poll-votes', data, overrideAccess: true })
    }

    if (!user) {
      cookieStore.set(cookieKey(pollId), '1', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365 })
    }

    revalidatePath(`/${locale}/dashboard/projekte/${slug}/m/polls`)
    revalidatePath(`/${locale}/projekte/${slug}`)
    return { ok: true }
  } catch {
    return { error: 'Abstimmung fehlgeschlagen.' }
  }
}
