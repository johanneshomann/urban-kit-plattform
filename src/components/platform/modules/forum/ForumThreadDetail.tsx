import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Lock } from 'lucide-react'
import { lexicalToHtml } from '@/lib/richtext'
import { ForumThreadView, type ForumCommentItem } from './ForumThreadView'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
function personName(u: unknown): string {
  if (!u || typeof u !== 'object') return 'Unbekannt'
  const o = u as { firstName?: string; lastName?: string; email?: string }
  return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
}

/** Forum thread detail: thread body + comments (members only; gating done by caller). */
export async function ForumThreadDetail({ slug, locale, projectId, itemSlug, userId }: { slug: string; locale: string; projectId: string; itemSlug: string; userId: string | null }) {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: 'forum-threads', where: { and: [{ project: { equals: projectId } }, { slug: { equals: itemSlug } }] }, limit: 1, depth: 1, overrideAccess: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thread = res.docs[0] as any
  if (!thread) notFound()

  const commentsRes = await payload.find({ collection: 'forum-comments', where: { thread: { equals: thread.id } }, sort: 'createdAt', limit: 500, depth: 1, overrideAccess: true })
  const comments: ForumCommentItem[] = commentsRes.docs.map((doc) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = doc as any
    return {
      id: String(c.id),
      html: lexicalToHtml(c.content),
      authorName: personName(c.author),
      createdAt: c.createdAt,
      canDelete: !!userId && relId(c.author) === userId,
    }
  })

  const bodyHtml = lexicalToHtml(thread.content)

  return (
    <div>
      <Link href={`/${locale}/dashboard/projekte/${slug}/m/forum`} className="inline-flex items-center gap-1 text-small mb-5 transition-opacity opacity-60 hover:opacity-100" style={{ color: 'var(--project-dark)' }}>
        <ChevronLeft className="w-[1em] h-[1em]" /> Alle Themen
      </Link>

      <h1 className="flex items-center gap-2 text-title font-bold leading-tight mb-2" style={{ color: 'var(--project-dark)' }}>
        {thread.locked && <Lock className="w-5 h-5 shrink-0" style={{ opacity: 0.5 }} />}
        {thread.title}
      </h1>
      <p className="text-small mb-5" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>
        {personName(thread.author)} · {new Date(thread.createdAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      {bodyHtml && <div className="prose-news text-text leading-relaxed" style={{ color: 'var(--project-dark)' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}

      <ForumThreadView slug={slug} locale={locale} threadId={String(thread.id)} comments={comments} locked={thread.locked === true} canParticipate={!!userId} />
    </div>
  )
}
