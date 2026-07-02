import 'server-only'
import type { Payload } from 'payload'
import type { ModuleCardData } from '@/components/platform/ModuleSection'

const mediaUrl = (v: unknown): string | null =>
  v && typeof v === 'object' ? ((v as { url?: string | null }).url ?? null) : null

/**
 * Load the content previews shown on the project-workspace module cards.
 * Each module is fetched only if enabled; everything is `overrideAccess` and
 * individually guarded so one failure can't blank the page.
 */
export async function loadWorkspaceCards(
  payload: Payload,
  projectId: string,
  modules: string[],
): Promise<ModuleCardData> {
  const has = (m: string) => modules.includes(m)
  const byProject = { project: { equals: projectId } }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const recent = (extra?: Record<string, unknown>) => ({
    and: [byProject, { createdAt: { greater_than_equal: since } }, ...(extra ? [extra] : [])],
  })
  const count = (collection: string, where: unknown) =>
    payload.count({ collection: collection as never, where: where as never, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0)

  const [
    news, newsNew,
    events,
    poll,
    forumCount, forumNewCount,
    tasks, tasksOpenCount,
    boardCount,
    files, filesNewCount,
  ] = await Promise.all([
    has('news')
      ? payload.find({ collection: 'news-posts', where: byProject, sort: '-publishedAt', limit: 3, depth: 1, overrideAccess: true }).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),
    has('news') ? count('news-posts', recent()) : Promise.resolve(0),

    has('calendar')
      ? payload.find({ collection: 'calendar-events', where: { and: [byProject, { startDate: { greater_than_equal: new Date().toISOString() } }] }, sort: 'startDate', limit: 3, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),

    has('polls')
      ? payload.find({ collection: 'polls', where: { and: [byProject, { status: { equals: 'active' } }] }, sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),

    has('forum') ? count('forum-threads', byProject) : Promise.resolve(0),
    has('forum') ? count('forum-threads', recent()) : Promise.resolve(0),

    has('tasks')
      ? payload.find({ collection: 'tasks', where: byProject, sort: '-createdAt', limit: 4, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),
    has('tasks') ? count('tasks', { and: [byProject, { status: { not_equals: 'done' } }] }) : Promise.resolve(0),

    has('board') ? count('board-canvases', byProject) : Promise.resolve(0),

    has('files')
      ? payload.find({ collection: 'file-uploads', where: byProject, sort: '-createdAt', limit: 3, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),
    has('files') ? count('file-uploads', recent()) : Promise.resolve(0),
  ])

  // Participants for the featured poll (approx: total votes cast)
  const featuredPollDoc = poll.docs[0] as { id: string | number; title?: string; createdAt?: string; closesAt?: string | null } | undefined
  const pollParticipants = featuredPollDoc ? await count('poll-votes', { poll: { equals: featuredPollDoc.id } }) : 0

  return {
    newsPosts: (news.docs as Array<Record<string, unknown>>).map((p) => ({
      id: String(p.id), title: String(p.title ?? ''), slug: String(p.slug ?? ''),
      publishedAt: (p.publishedAt as string) ?? null, thumbUrl: mediaUrl(p.featuredImage),
    })),
    newsNewCount: newsNew,
    calEvents: (events.docs as Array<Record<string, unknown>>).map((e) => ({
      id: String(e.id), title: String(e.title ?? ''), startDate: String(e.startDate),
      endDate: (e.endDate as string) ?? null, allDay: (e.allDay as boolean) ?? false,
    })),
    featuredPoll: featuredPollDoc
      ? { id: String(featuredPollDoc.id), title: String(featuredPollDoc.title ?? ''), participants: pollParticipants, createdAt: featuredPollDoc.createdAt ?? null, closesAt: featuredPollDoc.closesAt ?? null }
      : null,
    forumCount, forumNewCount,
    tasksPreview: (tasks.docs as Array<Record<string, unknown>>).map((t) => ({
      id: String(t.id), title: String(t.title ?? ''), done: t.status === 'done',
    })),
    tasksOpenCount,
    boardCount,
    filesPreview: (files.docs as Array<Record<string, unknown>>).map((f) => ({
      id: String(f.id), name: String(f.label || f.filename || 'Datei'),
    })),
    filesNewCount,
  }
}
