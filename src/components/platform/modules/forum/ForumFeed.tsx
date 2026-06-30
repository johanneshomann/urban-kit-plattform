import { getPayload } from 'payload'
import config from '@payload-config'
import { isProjectManager } from '@/lib/access/project'
import { ForumList, type ForumListItem } from './ForumList'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
function personName(u: unknown): string {
  if (!u || typeof u !== 'object') return 'Unbekannt'
  const o = u as { firstName?: string; lastName?: string; email?: string }
  return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
}

/** Loads a project's forum threads with vote/comment aggregates and renders the list. */
export async function ForumFeed({ slug, locale, projectId, userId }: { slug: string; locale: string; projectId: string; userId: string | null }) {
  const payload = await getPayload({ config })
  const threadsRes = await payload.find({ collection: 'forum-threads', where: { project: { equals: projectId } }, limit: 300, depth: 1, overrideAccess: true })
  const ids = threadsRes.docs.map((t) => (t as { id: string | number }).id)

  const [votesRes, commentsRes] = ids.length
    ? await Promise.all([
        payload.find({ collection: 'forum-thread-votes', where: { thread: { in: ids } }, limit: 100000, depth: 0, overrideAccess: true }),
        payload.find({ collection: 'forum-comments', where: { thread: { in: ids } }, limit: 100000, depth: 0, overrideAccess: true }),
      ])
    : [{ docs: [] as unknown[] }, { docs: [] as unknown[] }]

  const voteCount = new Map<string, number>(), myVote = new Set<string>()
  for (const v of votesRes.docs) {
    const th = relId((v as { thread?: unknown }).thread); if (!th) continue
    voteCount.set(th, (voteCount.get(th) ?? 0) + 1)
    if (userId && relId((v as { user?: unknown }).user) === userId) myVote.add(th)
  }
  const commentCount = new Map<string, number>(), lastActivity = new Map<string, number>()
  for (const c of commentsRes.docs) {
    const th = relId((c as { thread?: unknown }).thread); if (!th) continue
    commentCount.set(th, (commentCount.get(th) ?? 0) + 1)
    const t = new Date((c as { createdAt?: string }).createdAt ?? 0).getTime()
    if (t > (lastActivity.get(th) ?? 0)) lastActivity.set(th, t)
  }

  const isPM = userId ? await isProjectManager(payload, userId, projectId) : false

  const items: ForumListItem[] = threadsRes.docs.map((doc) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = doc as any
    const id = String(t.id)
    return {
      id, slug: t.slug, title: t.title ?? '',
      authorName: personName(t.author),
      createdAt: t.createdAt,
      commentCount: commentCount.get(id) ?? 0,
      voteCount: voteCount.get(id) ?? 0,
      hasVoted: myVote.has(id),
      pinned: t.pinned === true,
      locked: t.locked === true,
      canDelete: relId(t.author) === userId,
      _activity: Math.max(new Date(t.createdAt ?? 0).getTime(), lastActivity.get(id) ?? 0),
    } as ForumListItem & { _activity: number }
  })

  // pinned first, then most recent activity
  items.sort((a, b) => Number(b.pinned) - Number(a.pinned) || ((b as ForumListItem & { _activity: number })._activity - (a as ForumListItem & { _activity: number })._activity))

  return <ForumList slug={slug} locale={locale} threads={items} isPM={isPM} />
}
