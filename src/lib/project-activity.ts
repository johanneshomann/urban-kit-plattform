import 'server-only'
import type { Payload } from 'payload'

export type ActivityType = 'news' | 'event' | 'forum' | 'file' | 'task'
export interface ActivityItem {
  type: ActivityType
  title: string
  date: string
}

/**
 * The most recent cross-module activity for a project (for the hero
 * "Aktivität zuletzt" card). Only enabled modules are queried; each source is
 * guarded so one failure can't blank the feed. Returns up to `limit` items,
 * newest first.
 */
export async function loadProjectActivity(
  payload: Payload,
  projectId: string,
  modules: string[],
  limit = 4,
): Promise<ActivityItem[]> {
  const has = (m: string) => modules.includes(m)
  const where = { project: { equals: projectId } }
  const opts = { where, limit: 5, depth: 0, overrideAccess: true } as const
  const grab = (collection: string, sort: string) =>
    payload.find({ collection: collection as never, sort, ...opts }).then((r) => r.docs as Array<Record<string, unknown>>).catch(() => [])

  const [news, events, forum, files, tasks] = await Promise.all([
    has('news') ? grab('news-posts', '-publishedAt') : Promise.resolve([]),
    has('calendar') ? grab('calendar-events', '-createdAt') : Promise.resolve([]),
    has('forum') ? grab('forum-threads', '-createdAt') : Promise.resolve([]),
    has('files') ? grab('file-uploads', '-createdAt') : Promise.resolve([]),
    has('tasks') ? grab('tasks', '-createdAt') : Promise.resolve([]),
  ])

  const items: ActivityItem[] = [
    ...news.map((d) => ({ type: 'news' as const, title: String(d.title ?? ''), date: String(d.publishedAt ?? d.createdAt ?? '') })),
    ...events.map((d) => ({ type: 'event' as const, title: String(d.title ?? ''), date: String(d.createdAt ?? '') })),
    ...forum.map((d) => ({ type: 'forum' as const, title: String(d.title ?? ''), date: String(d.createdAt ?? '') })),
    ...files.map((d) => ({ type: 'file' as const, title: String(d.label || d.filename || 'Datei'), date: String(d.createdAt ?? '') })),
    ...tasks.map((d) => ({ type: 'task' as const, title: String(d.title ?? ''), date: String(d.createdAt ?? '') })),
  ]

  return items
    .filter((i) => i.date && i.title)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}
