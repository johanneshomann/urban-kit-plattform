import { getPayload } from 'payload'
import config from '@payload-config'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { lexicalToHtml } from '@/lib/richtext'
import { getUser } from '@/lib/auth/getUser'
import { isProjectManager } from '@/lib/access/project'
import { getViewerTier, canView, type Visibility } from '@/lib/visibility'
import { loadPostComments } from '@/lib/news'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { NewsComments } from '@/components/platform/modules/news/NewsComments'
import { ForumThreadDetail } from '@/components/platform/modules/forum/ForumThreadDetail'

export default async function ModuleItemPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; moduleType: string; itemSlug: string }>
}) {
  const { locale, slug, moduleType, itemSlug } = await params
  if (moduleType !== 'news' && moduleType !== 'forum') notFound()

  const payload = await getPayload({ config })
  const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const project = projectRes.docs[0] as unknown as { id: string; modules?: string[] } | undefined
  const modules = project?.modules ?? ['news', 'calendar']
  if (!project || !modules.includes(moduleType)) notFound()

  const [tm, tw] = await Promise.all([
    getTranslations({ locale, namespace: 'modules' }),
    getTranslations({ locale, namespace: 'projectWorkspace' }),
  ])

  const user = await getUser()
  const userId = user ? String(user.id) : null
  const tier = await getViewerTier(payload, userId, project.id)
  const isPM = userId ? await isProjectManager(payload, userId, project.id) : false

  // News: fetch the post up front (title feeds the breadcrumb, doc feeds the article)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let post: any = null
  let itemTitle = ''
  if (moduleType === 'news') {
    const postRes = await payload.find({
      collection: 'news-posts',
      where: { and: [{ project: { equals: project.id } }, { slug: { equals: itemSlug } }] },
      limit: 1, depth: 1, overrideAccess: true,
    })
    post = postRes.docs[0] ?? null
    if (!post) notFound()
    const live = !!post.publishedAt && new Date(post.publishedAt).getTime() <= Date.now()
    if (!live || !canView(tier, post.visibility as Visibility)) notFound()
    itemTitle = post.title ?? ''
  } else {
    // Forum: title-only fetch for the breadcrumb (detail component loads the rest)
    const threadRes = await payload.find({
      collection: 'forum-threads',
      where: { and: [{ project: { equals: project.id } }, { slug: { equals: itemSlug } }] },
      limit: 1, depth: 0, overrideAccess: true,
    })
    itemTitle = (threadRes.docs[0] as { title?: string } | undefined)?.title ?? ''
  }

  const root = `/${locale}/dashboard/projekte/${slug}`

  return (
    <div style={{ background: 'var(--project-light)', minHeight: 'calc(100svh - 14rem)' }}>
      <ProjectBreadcrumb
        items={[
          { label: tw('breadcrumbDashboard'), href: root },
          { label: tm(moduleType), href: `${root}/m/${moduleType}` },
          ...(itemTitle ? [{ label: itemTitle }] : []),
        ]}
      />
      <main className="p-6 md:p-8 max-w-3xl mx-auto w-full">
        {moduleType === 'forum'
          ? (tier === 'public'
              ? notFound()
              : <ForumThreadDetail slug={slug} locale={locale} projectId={project.id} itemSlug={itemSlug} userId={userId} />)
          : await renderNews()}
      </main>
    </div>
  )

  async function renderNews() {
    const comments = await loadPostComments(payload, String(post.id), { userId, isPM })
    const bodyHtml = lexicalToHtml(post.content)
    const img = post.featuredImage && typeof post.featuredImage === 'object' ? post.featuredImage.url : null

    return (
      <>
        <article>
          <h1 className="text-title font-bold leading-tight mb-2" style={{ color: 'var(--project-dark)' }}>{post.title}</h1>
          {post.publishedAt && <p className="text-small mb-5" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{new Date(post.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          {img && <img src={img} alt="" className="w-full rounded-xl mb-6 object-cover" style={{ maxHeight: '24rem' }} />}
          {bodyHtml && <div className="prose-news text-text leading-relaxed" style={{ color: 'var(--project-dark)' }} dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
        </article>
        <NewsComments slug={slug} locale={locale} postId={String(post.id)} comments={comments} canComment={tier !== 'public'} />
      </>
    )
  }
}
