// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'
import type { Payload } from 'payload'
import type { ModuleCardData } from '@/components/platform/ModuleSection'
import { canViewContent, visibilityWhere, type ViewerContext, type ViewerMembership } from '@/lib/visibility'

const mediaUrl = (v: unknown): string | null =>
  v && typeof v === 'object' ? ((v as { url?: string | null }).url ?? null) : null

type VisDoc = Record<string, unknown> & { visibility?: string | null; visibilityTeams?: string[] | null }

/**
 * Load the content previews shown on the project-workspace module cards.
 * Each module is fetched only if enabled; everything is individually guarded
 * so one failure can't blank the page.
 *
 * Visibility: titles/labels reach the DOM, so every list query and count
 * carries `visibilityWhere(viewer)`; list docs are additionally re-checked
 * with `canViewContent` (per-doc TEAM parity). News only counts once
 * published. Board canvases carry no visibility field — only their count is
 * shown, and the collaborate section is member-gated by the page.
 */
export async function loadWorkspaceCards(
  payload: Payload,
  projectId: string,
  modules: string[],
  viewer: ViewerContext,
  membership: ViewerMembership | null,
): Promise<ModuleCardData> {
  const has = (m: string) => modules.includes(m)
  const byProject = { project: { equals: projectId } }
  const vis = visibilityWhere(viewer)
  const now = new Date().toISOString()
  const publishedNews = { publishedAt: { less_than_equal: now } }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const recent = (extra?: Record<string, unknown>) => ({
    and: [byProject, vis, { createdAt: { greater_than_equal: since } }, ...(extra ? [extra] : [])],
  })
  const count = (collection: string, where: unknown) =>
    payload.count({ collection: collection as never, where: where as never, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0)
  const list = (collection: string, opts: { sort: string; limit: number; depth?: number; extra?: Record<string, unknown>[] }) =>
    payload
      .find({
        collection: collection as never,
        where: { and: [byProject, vis, ...(opts.extra ?? [])] } as never,
        sort: opts.sort,
        limit: opts.limit,
        depth: opts.depth ?? 0,
        overrideAccess: true,
      })
      .then((r) => (r.docs as VisDoc[]).filter((d) => canViewContent(membership, d)))
      .catch(() => [] as VisDoc[])

  const [
    news, newsNew,
    events,
    pollDocs,
    forumCount, forumNewCount,
    tasks, tasksOpenCount,
    boardCount,
    files, filesNewCount,
  ] = await Promise.all([
    has('news') ? list('news-posts', { sort: '-publishedAt', limit: 3, depth: 1, extra: [publishedNews] }) : Promise.resolve([]),
    has('news') ? count('news-posts', recent(publishedNews)) : Promise.resolve(0),

    has('calendar')
      ? list('calendar-events', { sort: 'startDate', limit: 3, extra: [{ startDate: { greater_than_equal: now } }] })
      : Promise.resolve([]),

    has('polls') ? list('polls', { sort: '-createdAt', limit: 1, extra: [{ status: { equals: 'active' } }] }) : Promise.resolve([]),

    has('forum') ? count('forum-threads', { and: [byProject, vis] }) : Promise.resolve(0),
    has('forum') ? count('forum-threads', recent()) : Promise.resolve(0),

    has('tasks') ? list('tasks', { sort: '-createdAt', limit: 4 }) : Promise.resolve([]),
    has('tasks') ? count('tasks', { and: [byProject, vis, { status: { not_equals: 'done' } }] }) : Promise.resolve(0),

    has('board') ? count('board-canvases', byProject) : Promise.resolve(0),

    has('files') ? list('file-uploads', { sort: '-createdAt', limit: 3 }) : Promise.resolve([]),
    has('files') ? count('file-uploads', recent()) : Promise.resolve(0),
  ])

  // Participants for the featured poll (approx: total votes cast)
  const featuredPollDoc = pollDocs[0] as (VisDoc & { id: string | number; title?: string; createdAt?: string; closesAt?: string | null }) | undefined
  const pollParticipants = featuredPollDoc ? await count('poll-votes', { poll: { equals: featuredPollDoc.id } }) : 0

  return {
    newsPosts: news.map((p) => ({
      id: String(p.id), title: String(p.title ?? ''), slug: String(p.slug ?? ''),
      publishedAt: (p.publishedAt as string) ?? null, thumbUrl: mediaUrl(p.featuredImage),
    })),
    newsNewCount: newsNew,
    calEvents: events.map((e) => ({
      id: String(e.id), title: String(e.title ?? ''), startDate: String(e.startDate),
      endDate: (e.endDate as string) ?? null, allDay: (e.allDay as boolean) ?? false,
    })),
    featuredPoll: featuredPollDoc
      ? { id: String(featuredPollDoc.id), title: String(featuredPollDoc.title ?? ''), participants: pollParticipants, createdAt: featuredPollDoc.createdAt ?? null, closesAt: featuredPollDoc.closesAt ?? null }
      : null,
    forumCount, forumNewCount,
    tasksPreview: tasks.map((t) => ({
      id: String(t.id), title: String(t.title ?? ''), done: t.status === 'done',
    })),
    tasksOpenCount,
    boardCount,
    filesPreview: files.map((f) => ({
      id: String(f.id), name: String(f.label || f.filename || 'Datei'),
    })),
    filesNewCount,
  }
}
