import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; postSlug: string }>
}): Promise<Metadata> {
  const { locale, slug, postSlug } = await params
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'news-posts',
      where: { and: [{ slug: { equals: postSlug } }, { visibility: { equals: 'PUBLIC' } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (result.totalDocs > 0) {
      const p = result.docs[0] as unknown as { title: string; publishedAt?: string }
      const url = `${base}/${locale}/projekte/${slug}/news/${postSlug}`
      return {
        title: p.title,
        alternates: { canonical: url },
        openGraph: { title: p.title, url, type: 'article', publishedTime: p.publishedAt },
      }
    }
  } catch {}
  return { title: postSlug }
}

export default async function PublicNewsPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; postSlug: string }>
}) {
  const { locale, slug, postSlug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'news-posts',
    where: {
      and: [
        { slug: { equals: postSlug } },
        { visibility: { equals: 'PUBLIC' } },
        { publishedAt: { exists: true } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) notFound()
  const post = result.docs[0] as unknown as { title: string; publishedAt?: string }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <Link href={`/${locale}/projekte/${slug}`} className="text-sm text-blue-600 hover:underline mb-4 block">
        ← {slug}
      </Link>
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      {post.publishedAt && (
        <p className="text-sm text-gray-500 mb-6">
          {new Date(post.publishedAt).toLocaleDateString('de-DE')}
        </p>
      )}
    </main>
  )
}
