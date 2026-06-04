import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicNav } from '@/components/public/PublicNav'
import { PublicFooter } from '@/components/public/PublicFooter'
import { getCitySettings } from '@/lib/instance'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'projects',
      where: { and: [{ slug: { equals: slug } }, { visibility: { equals: 'PUBLIC' } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (result.totalDocs > 0) {
      const p = result.docs[0] as unknown as { title: string; summary?: string }
      return {
        title: p.title,
        description: p.summary,
        alternates: { canonical: `${base}/${locale}/projekte/${slug}` },
        openGraph: { title: p.title, description: p.summary ?? '', url: `${base}/${locale}/projekte/${slug}`, type: 'website' },
      }
    }
  } catch {}
  return { title: slug }
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const { cityName, cityLogoUrl } = await getCitySettings()

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'projects',
    where: { and: [{ slug: { equals: slug } }, { visibility: { equals: 'PUBLIC' } }] },
    limit: 1,
    overrideAccess: true,
  })
  if (result.totalDocs === 0) notFound()

  const project = result.docs[0] as unknown as {
    id: string
    title: string
    summary?: string
    joinRequestsEnabled?: boolean
  }

  // Fetch latest public news posts for this project
  let newsPosts: { id: string; title: string; slug: string; publishedAt?: string }[] = []
  try {
    const newsResult = await payload.find({
      collection: 'news-posts',
      where: {
        and: [
          { 'projectModule.project.slug': { equals: slug } },
          { visibility: { equals: 'PUBLIC' } },
          { publishedAt: { exists: true } },
        ],
      },
      sort: '-publishedAt',
      limit: 5,
      overrideAccess: true,
    })
    newsPosts = newsResult.docs as unknown as typeof newsPosts
  } catch {}

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav locale={locale} cityName={cityName} cityLogoUrl={cityLogoUrl} />

      <main className="flex-1">
        {/* Project header */}
        <section className="bg-gray-50 border-b py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <Link href={`/${locale}/projekte`} className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">
              ← Alle Projekte
            </Link>
            <h1 className="text-4xl font-bold mb-3">{project.title}</h1>
            {project.summary && <p className="text-xl text-gray-600 max-w-2xl mb-6">{project.summary}</p>}
            <div className="flex gap-3 flex-wrap">
              {project.joinRequestsEnabled && (
                <Link
                  href={`/${locale}/projekte/${slug}/mitmachen`}
                  className="px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Mitmachen
                </Link>
              )}
              <Link
                href="/admin"
                className="px-5 py-2 border text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                Zum Projektraum →
              </Link>
            </div>
          </div>
        </section>

        {/* News */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Neuigkeiten</h2>
            {newsPosts.length === 0 ? (
              <p className="text-gray-400 text-sm">Noch keine Neuigkeiten veröffentlicht.</p>
            ) : (
              <div className="space-y-4">
                {newsPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${locale}/projekte/${slug}/news/${post.slug}`}
                    className="group block border rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold group-hover:text-blue-600 transition-colors">{post.title}</h3>
                    {post.publishedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(post.publishedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter locale={locale} />
    </div>
  )
}
