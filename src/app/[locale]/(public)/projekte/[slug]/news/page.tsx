import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ProjectBackButton } from '@/components/public/ProjectBackButton'
import { Newspaper } from 'lucide-react'

type Project = { id: string; title: string; slug: string; isPublic?: boolean | null }
type NewsPost = { id: string; title: string; slug: string; publishedAt?: string | null; featuredImage?: { url?: string; alt?: string | null } | null }

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
      depth: 1,
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
  const pd = await getTranslations({ locale, namespace: 'projectDetail' })
  const data = await getPublicNews(slug)
  if (!data) notFound()
  const { project, posts } = data
  const dateLocale = locale === 'en' ? 'en-GB' : 'de-DE'

  return (
    <div className="flex flex-col">
      {/* Hero — chip row, min-vh, no border into content */}
      <section className="relative min-h-[500px] overflow-hidden flex flex-col justify-center px-6 md:px-16 lg:px-24 py-16 md:py-24" style={{ background: 'var(--plattform-light)' }}>
        <Newspaper
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[40%] w-auto opacity-[0.06] pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--plattform)' }}
        />
        <div className="relative z-10 w-full" style={{ maxWidth: 'var(--plattform-content-width)' }}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <ProjectBackButton locale={locale} fallback={`/${locale}/projekte/${project.slug}`} />
            <EyebrowBadge label={pd('newsBreadcrumbLabel')} />
          </div>
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t('allTitle')}<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>
          <p className="text-text max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>
            {pd('newsSubtitle', { project: project.title })}
          </p>
        </div>
      </section>

      {/* Content — methoden column: section-level max-width, no border above */}
      <main className="mx-auto w-full max-w-[var(--plattform-content-width)] flex-1 px-6 md:px-16 py-12 md:py-20" style={{ background: 'var(--plattform-white)' }}>
        <div>
          {posts.length === 0 ? (
            <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>{t('empty')}</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/${locale}/projekte/${project.slug}/news/${post.slug}`}
                    className="group relative overflow-hidden rounded-xl p-6 shadow-sm hover:shadow-md transition-all block"
                  >
                    {/* Hover image — same white/85 wash as the project hero */}
                    {post.featuredImage?.url && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden>
                        <img src={post.featuredImage.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-white/85" />
                      </div>
                    )}
                    <div className="relative z-10">
                      {post.publishedAt && (
                        <time className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
                          {new Date(post.publishedAt).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })}
                        </time>
                      )}
                      <p className="text-text font-bold mt-1 group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>
                        {post.title}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </main>
    </div>
  )
}