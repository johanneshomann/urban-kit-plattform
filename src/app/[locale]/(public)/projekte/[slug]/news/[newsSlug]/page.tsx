import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { PublicNavServer } from '@/components/public/PublicNavServer'
import { PublicFooter } from '@/components/public/PublicFooter'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { CtaButton } from '@/components/public/CtaButton'
import { resolveColorScheme } from '@/lib/colorScheme'
import { ArrowLeft, FolderOpen } from 'lucide-react'

type Project = {
  id: string
  title: string
  slug: string
  colorScheme?: string | null
  isPublic?: boolean | null
}

type NewsPost = {
  id: string
  title: string
  slug: string
  publishedAt?: string | null
  content?: unknown
  featuredImage?: { url?: string; alt?: string | null } | null
  author?: { firstName?: string | null; lastName?: string | null } | null
}

async function getPublicNewsPost(
  slug: string,
  newsSlug: string,
): Promise<{ project: Project; post: NewsPost } | null> {
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

    const postResult = await payload.find({
      collection: 'news-posts',
      where: {
        and: [
          { slug: { equals: newsSlug } },
          { project: { equals: project.id } },
          { visibility: { equals: 'PUBLIC' } },
          { publishedAt: { exists: true } },
        ],
      },
      depth: 1,
      limit: 1,
      overrideAccess: true,
    })
    const post = postResult.docs[0] as unknown as NewsPost | undefined
    if (!post) return null

    return { project, post }
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; newsSlug: string }>
}): Promise<Metadata> {
  const { locale, slug, newsSlug } = await params
  const t = await getTranslations({ locale, namespace: 'newsDetail' })
  const data = await getPublicNewsPost(slug, newsSlug)
  if (!data) return { title: t('metaFallbackTitle') }

  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://urbankit.de'
  return {
    title: `${data.post.title} – ${data.project.title}`,
    description: t('metaDesc', { project: data.project.title }),
    alternates: { canonical: `${base}/${locale}/projekte/${slug}/news/${newsSlug}` },
    openGraph: {
      title: `${data.post.title} – ${data.project.title}`,
      url: `${base}/${locale}/projekte/${slug}/news/${newsSlug}`,
      type: 'article',
    },
  }
}

export default async function PublicProjectNewsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; newsSlug: string }>
}) {
  const { locale, slug, newsSlug } = await params
  const t = await getTranslations({ locale, namespace: 'newsDetail' })
  const data = await getPublicNewsPost(slug, newsSlug)
  if (!data) notFound()
  const { project, post } = data

  const scheme = resolveColorScheme(project.colorScheme)
  const contentHtml = post.content
    ? convertLexicalToHTML({ data: post.content as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null
  const author = post.author
    ? [post.author.firstName, post.author.lastName].filter(Boolean).join(' ')
    : null
  const publishedAt = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-svh flex flex-col">
      <PublicNavServer locale={locale} />

      {/* Article header */}
      <section className="relative border-b overflow-hidden" style={{ background: 'var(--plattform-light)' }}>
        {/* Project colour bar — the page's "badge" */}
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: scheme.mid }} />
        <div className="px-6 md:px-16 lg:px-24 pt-20 md:pt-28 pb-10 md:pb-14">
          <EyebrowBadge label={project.title} bg={scheme.light} color={scheme.dark} />
          <h1 className="text-title font-black leading-tight tracking-tight mb-5 max-w-4xl">
            {post.title}<span style={{ color: 'var(--plattform)' }}>.</span>
          </h1>
          <p className="text-small" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
            {[publishedAt, author].filter(Boolean).join(' · ')}
          </p>
        </div>
      </section>

      {/* Article body */}
      <main className="flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-24 border-b" style={{ background: 'white' }}>
        <article className="max-w-3xl">
          {post.featuredImage?.url && (
            <img
              src={post.featuredImage.url}
              alt={post.featuredImage.alt ?? post.title}
              className="w-full max-h-[55svh] object-cover rounded-xl border mb-12"
            />
          )}
          {contentHtml ? (
            <div
              className="prose max-w-none text-text leading-relaxed"
              style={{ color: 'var(--plattform-ink)' }}
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : (
            <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>
              {t('empty')}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-12">
            <CtaButton href={`/${locale}/projekte/${project.slug}`} label={t('toProject')} icon={<ArrowLeft />} />
            <CtaButton href={`/${locale}/bereich/projekte-archiv/alle-projekte`} label={t('allProjects')} icon={<FolderOpen />} variant="white" />
          </div>
        </article>
      </main>

      <PublicFooter locale={locale} />
    </div>
  )
}
