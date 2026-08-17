// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'
import type { Payload } from 'payload'
import { canViewContent, visibilityWhere, type ViewerContext, type ViewerMembership } from '@/lib/visibility'

export type ActivityType = 'news' | 'event' | 'forum' | 'file' | 'task' | 'poll'
export interface ActivityItem {
  type: ActivityType
  title: string
  date: string
}

type VisDoc = Record<string, unknown> & { visibility?: string | null; visibilityTeams?: string[] | null }

/**
 * The most recent cross-module activity for a project (for the workspace
 * "Aktivität zuletzt" card). Only enabled modules are queried; each source is
 * guarded so one failure can't blank the feed.
 *
 * Visibility: every query carries `visibilityWhere(viewer)` and every doc is
 * re-checked with `canViewContent` (per-doc TEAM parity incl. legacy rows) —
 * titles here reach the DOM, so this must be as strict as the module pages.
 * News additionally only counts once published.
 */
export async function loadProjectActivity(
  payload: Payload,
  projectId: string,
  modules: string[],
  viewer: ViewerContext,
  membership: ViewerMembership | null,
  limit = 4,
): Promise<ActivityItem[]> {
  const has = (m: string) => modules.includes(m)
  const vis = visibilityWhere(viewer)
  const now = new Date().toISOString()
  const grab = (collection: string, sort: string, extra?: Record<string, unknown>) =>
    payload
      .find({
        collection: collection as never,
        sort,
        where: { and: [{ project: { equals: projectId } }, vis, ...(extra ? [extra] : [])] } as never,
        limit: 5,
        depth: 0,
        overrideAccess: true,
      })
      .then((r) => (r.docs as VisDoc[]).filter((d) => canViewContent(membership, d)))
      .catch(() => [] as VisDoc[])

  const [news, events, forum, files, tasks, polls] = await Promise.all([
    has('news') ? grab('news-posts', '-publishedAt', { publishedAt: { less_than_equal: now } }) : Promise.resolve([]),
    has('calendar') ? grab('calendar-events', '-createdAt') : Promise.resolve([]),
    has('forum') ? grab('forum-threads', '-createdAt') : Promise.resolve([]),
    has('files') ? grab('file-uploads', '-createdAt') : Promise.resolve([]),
    has('tasks') ? grab('tasks', '-createdAt') : Promise.resolve([]),
    has('polls') ? grab('polls', '-createdAt', { status: { not_equals: 'draft' } }) : Promise.resolve([]),
  ])

  const items: ActivityItem[] = [
    ...news.map((d) => ({ type: 'news' as const, title: String(d.title ?? ''), date: String(d.publishedAt ?? d.createdAt ?? '') })),
    ...events.map((d) => ({ type: 'event' as const, title: String(d.title ?? ''), date: String(d.createdAt ?? '') })),
    ...forum.map((d) => ({ type: 'forum' as const, title: String(d.title ?? ''), date: String(d.createdAt ?? '') })),
    ...files.map((d) => ({ type: 'file' as const, title: String(d.label || d.filename || 'Datei'), date: String(d.createdAt ?? '') })),
    ...tasks.map((d) => ({ type: 'task' as const, title: String(d.title ?? ''), date: String(d.createdAt ?? '') })),
    ...polls.map((d) => ({ type: 'poll' as const, title: String(d.title ?? ''), date: String(d.createdAt ?? '') })),
  ]

  return items
    .filter((i) => i.date && i.title)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}
