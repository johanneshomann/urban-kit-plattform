import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { getUser } from '@/lib/auth/getUser'
import { isProjectManager } from '@/lib/access/project'
import { getViewerTier, canView, type Visibility } from '@/lib/visibility'
import { loadPostComments } from '@/lib/news'
import { ProjectModuleNav } from '@/components/platform/ProjectModuleNav'
import { NewsComments } from '@/components/platform/modules/news/NewsComments'

export default async function ModuleItemPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; moduleType: string; itemSlug: string }>
}) {
  const { locale, slug, moduleType, itemSlug } = await params
  if (moduleType !== 'news') notFound() // calendar/poll detail added in later slices

  const payload = await getPayload({ config })
  const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const project = projectRes.docs[0] as unknown as { id: string; modules?: string[] } | undefined
  if (!project || !(project.modules ?? ['news', 'calendar']).includes('news')) notFound()

  const user = await getUser()
  const tier = await getViewerTier(payload, user ? String(user.id) : null, project.id)

  const postRes = await payload.find({
    collection: 'news-posts',
    where: { and: [{ project: { equals: project.id } }, { slug: { equals: itemSlug } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post = postRes.docs[0] as any
  if (!post) notFound()

  const live = !!post.publishedAt && new Date(post.publishedAt).getTime() <= Date.now()
  if (!live || !canView(tier, post.visibility as Visibility)) notFound()

  const isPM = user ? await isProjectManager(payload, String(user.id), project.id) : false
  const comments = await loadPostComments(payload, String(post.id), { userId: user ? String(user.id) : null, isPM })
  const bodyHtml = post.content ? convertLexicalToHTML({ data: post.content }) : null
  const img = post.featuredImage && typeof post.featuredImage === 'object' ? post.featuredImage.url : null

  return (
    <div>
      <ProjectModuleNav modules={project.modules ?? ['news', 'calendar']} slug={slug} locale={locale} activeModule="news" />
      <main className="p-6 md:p-8 max-w-3xl mx-auto w-full" style={{ minHeight: 'calc(100svh - 8rem)' }}>
        <Link href={`/${locale}/dashboard/projekte/${slug}/m/news`} className="inline-flex items-center gap-1 text-small mb-5 transition-opacity opacity-60 hover:opacity-100" style={{ color: 'var(--project-dark)' }}>
          <ChevronLeft className="w-[1em] h-[1em]" /> Alle Beiträge
        </Link>

        <article>
          <h1 className="text-title font-bold leading-tight mb-2" style={{ color: 'var(--project-dark)' }}>{post.title}</h1>
          {post.publishedAt && <p className="text-small mb-5" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{new Date(post.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          {img && <img src={img} alt="" className="w-full rounded-xl mb-6 object-cover" style={{ maxHeight: '24rem' }} />}
          {bodyHtml && <div className="prose-news text-text leading-relaxed" style={{ color: 'var(--project-dark)' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
        </article>

        <NewsComments slug={slug} locale={locale} postId={String(post.id)} comments={comments} canComment={tier !== 'public'} />
      </main>
    </div>
  )
}
