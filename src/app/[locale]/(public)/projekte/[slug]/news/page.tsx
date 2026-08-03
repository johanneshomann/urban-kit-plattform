import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ArrowLeft, Newspaper } from 'lucide-react'

type Project = { id: string; title: string; slug: string; isPublic?: boolean | null }
type NewsPost = { id: string; title: string; slug: string; publishedAt?: string | null }

async function getPublicNews(slug: string): Promise<{ project: Project; posts: NewsPost[] } | null> {
  try {
    const payload = await getPayload({ config })
    const projectResult = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
    const project = projectResult.docs[0] as unknown as Project | undefined
    if (!project || project.isPublic === false) return null

    const postsResult = await payload.find({
      collection: 'news-posts',
      where: {
        and: [
          { project: { equals: project.id } },
          { visibility: { equals: 'PUBLIC' } },
          { publishedAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
      sort: '-publishedAt',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    return { project, posts: postsResult.docs as unknown as NewsPost[] }
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'newsDetail' })
  const data = await getPublicNews(slug)
  if (!data) return { title: t('metaFallbackTitle') }
  return { title: `${t('allTitle')} – ${data.project.title}` }
}

export default async function ProjectNewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: 'newsDetail' })
  const data = await getPublicNews(slug)
  if (!data) notFound()
  const { project, posts } = data
  const dateLocale = locale === 'en' ? 'en-GB' : 'de-DE'

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Header */}
      <section className="px-6 md:px-16 lg:px-24 pt-20 md:pt-28 pb-10 md:pb-14 border-b" style={{ background: 'var(--plattform-light)' }}>
        <EyebrowBadge label={project.title} />
        <h1 className="text-title font-black leading-tight tracking-tight mb-5">
          {t('allTitle')}<span style={{ color: 'var(--plattform)' }}>.</span>
        </h1>
        <Link
          href={`/${locale}/projekte/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-small transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--plattform-ink)' }}
        >
          <ArrowLeft className="w-[1em] h-[1em]" /> {t('toProject')}
        </Link>
      </section>

      {/* News list */}
      <main className="flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-20" style={{ background: 'white' }}>
        <div className="flex items-center gap-2 mb-8">
          <Newspaper className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
          <h2 className="text-display font-black tracking-tight">{t('allHeading')}</h2>
        </div>

        {posts.length === 0 ? (
          <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>{t('empty')}</p>
        ) : (
          <ol className="flex flex-col gap-4 max-w-3xl">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/${locale}/projekte/${project.slug}/news/${post.slug}`}
                  className="group block bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-all"
                >
                  {post.publishedAt && (
                    <time className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                      {new Date(post.publishedAt).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </time>
                  )}
                  <p className="text-text font-bold mt-1 group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>
                    {post.title}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>

      <PublicFooter locale={locale} />
    </div>
  )
}