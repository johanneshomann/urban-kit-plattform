// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'
import type { Payload } from 'payload'
import { cookies } from 'next/headers'
import { visibilityWhere, type ViewerContext } from '@/lib/visibility'
import { computeResults, type PollResults } from '@/lib/poll-results'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

interface VotingQuestion { id: string; text: string; type: string; options: { id: string; text: string }[] }
export interface CitizenPoll {
  id: string
  title: string
  description: string | null
  status: string
  hasVoted: boolean
  showResults: boolean
  canVote: boolean
  requiresLogin: boolean
  visibility: string | null
  visibilityTeams: string[]
  /** May the viewer manage this poll here? (author or PM) */
  canManage: boolean
  questions: VotingQuestion[]
  results: PollResults | null
}

/** Load a project's polls for citizen/public consumption, resolving per-poll
 *  vote eligibility and results visibility (respecting showLiveResults). */
export async function loadCitizenPolls(payload: Payload, projectId: string, viewer: ViewerContext, userId: string | null): Promise<CitizenPoll[]> {
  const pollsRes = await payload.find({
    collection: 'polls',
    where: { and: [{ project: { equals: projectId } }, { status: { in: ['active', 'closed'] } }, visibilityWhere(viewer)] },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  // Authors see their drafts right on the polls page (PMs see all drafts) —
  // without this, a freshly created poll would silently "disappear" until
  // activated from a manage surface.
  const canAuthor = !!userId && (viewer.isPM || viewer.leadOf.length > 0)
  const draftsRes = canAuthor
    ? await payload.find({
        collection: 'polls',
        where: {
          and: [
            { project: { equals: projectId } },
            { status: { equals: 'draft' } },
            ...(viewer.isPM ? [] : [{ author: { equals: userId } }]),
          ],
        },
        sort: '-createdAt',
        limit: 50,
        depth: 0,
        overrideAccess: true,
      })
    : { docs: [] as unknown[] }

  const allDocs = [...draftsRes.docs, ...pollsRes.docs]
  if (allDocs.length === 0) return []

  const cookieStore = await cookies()
  const out: CitizenPoll[] = []

  for (const doc of allDocs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = doc as any
    const id = String(p.id)
    const isDraft = p.status === 'draft'
    const canManage = viewer.isPM || (!!userId && relId(p.author) === userId)

    let hasVoted: boolean
    if (isDraft) {
      hasVoted = false
    } else if (userId) {
      const v = await payload.find({ collection: 'poll-votes', where: { and: [{ poll: { equals: id } }, { user: { equals: userId } }] }, limit: 1, depth: 0, overrideAccess: true })
      hasVoted = v.totalDocs > 0
    } else {
      hasVoted = !!cookieStore.get(`pollvoted-${id}`)?.value
    }

    const showResults = p.status === 'closed' || (!!p.showLiveResults && hasVoted)
    const canVote = p.status === 'active' && !hasVoted && (!!userId || !!p.allowAnonymous)
    const requiresLogin = p.status === 'active' && !hasVoted && !userId && !p.allowAnonymous

    let questions: VotingQuestion[] = []
    if (canVote) {
      const [qs, opts] = await Promise.all([
        payload.find({ collection: 'poll-questions', where: { poll: { equals: id } }, sort: 'order', limit: 500, depth: 0, overrideAccess: true }),
        payload.find({ collection: 'poll-options', where: {}, sort: 'order', limit: 2000, depth: 0, overrideAccess: true }),
      ])
      questions = qs.docs.map((q) => {
        const qid = String((q as { id: unknown }).id)
        return {
          id: qid,
          text: String((q as { text?: string }).text ?? ''),
          type: String((q as { type?: string }).type ?? 'single'),
          options: opts.docs.filter((o) => relId((o as { question?: unknown }).question) === qid).map((o) => ({ id: String((o as { id: unknown }).id), text: String((o as { text?: string }).text ?? '') })),
        }
      })
    }

    out.push({
      id,
      title: p.title ?? '',
      description: p.description ?? null,
      status: p.status ?? 'active',
      hasVoted,
      showResults,
      canVote,
      requiresLogin,
      visibility: p.visibility ?? null,
      visibilityTeams: Array.isArray(p.visibilityTeams) ? p.visibilityTeams : [],
      canManage,
      questions,
      results: showResults ? await computeResults(payload, id) : null,
    })
  }

  return out
}
