import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PublicForumThreadPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; threadSlug: string }>
}) {
  const { locale, slug, threadSlug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'forum-threads',
    where: { and: [{ slug: { equals: threadSlug } }, { visibility: { equals: 'PUBLIC' } }] },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) notFound()
  const thread = result.docs[0] as unknown as { id: string; title: string; category?: string; createdAt: string }

  const commentsResult = await payload.find({
    collection: 'forum-comments',
    where: { thread: { equals: thread.id } },
    sort: 'createdAt',
    overrideAccess: true,
  })

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <Link href={`/${locale}/projekte/${slug}`} className="text-sm text-blue-600 hover:underline mb-4 block">
        ← {slug}
      </Link>
      <div className="mb-4">
        {thread.category && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">{thread.category}</span>
        )}
        <h1 className="text-2xl font-bold mt-2">{thread.title}</h1>
        <p className="text-sm text-gray-500">{new Date(thread.createdAt).toLocaleDateString('de-DE')}</p>
      </div>
      <p className="text-gray-500 text-sm">{commentsResult.totalDocs} Kommentar(e)</p>
    </main>
  )
}
