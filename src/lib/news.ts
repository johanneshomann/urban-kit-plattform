import 'server-only'
import type { Payload } from 'payload'
import type { CommentItem } from '@/components/platform/modules/news/NewsComments'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

function personName(u: unknown): string {
  if (!u || typeof u !== 'object') return 'Unbekannt'
  const o = u as { firstName?: string; lastName?: string; email?: string }
  return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
}

/** Load a news post's comments, flagging which the viewer may delete (author or PM). */
export async function loadPostComments(
  payload: Payload,
  postId: string,
  viewer: { userId: string | null; isPM: boolean },
): Promise<CommentItem[]> {
  const res = await payload.find({
    collection: 'news-comments',
    where: { post: { equals: postId } },
    sort: 'createdAt',
    limit: 500,
    depth: 1,
    overrideAccess: true,
  })
  return res.docs.map((doc) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = doc as any
    const authorId = relId(c.author)
    return {
      id: String(c.id),
      body: String(c.body ?? ''),
      authorName: personName(c.author),
      createdAt: c.createdAt,
      canDelete: viewer.isPM || (!!viewer.userId && authorId === viewer.userId),
    }
  })
}
