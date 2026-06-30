import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { MODULE_LABELS } from '@/lib/options/modules'
import { lexicalToMarkdown, lexicalToHtml } from '@/lib/richtext'
import { ManagePlaceholder } from '@/components/platform/manage/ManagePlaceholder'
import { NewsManager, type NewsItem } from '@/components/platform/manage/NewsManager'
import { CalendarManager, type EventItem } from '@/components/platform/manage/CalendarManager'
import { PollsManager, type PollItem } from '@/components/platform/manage/PollsManager'
import { ForumModeration, type ModThread } from '@/components/platform/manage/ForumModeration'

export default async function ManageInhaltePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; moduleType: string }>
}) {
  const { locale, slug, moduleType } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  // Module must be enabled on this project
  const enabled = ctx.project.modules ?? ['news', 'calendar']
  if (!enabled.includes(moduleType)) notFound()

  const payload = await getPayload({ config })

  if (moduleType === 'news') {
    const res = await payload.find({
      collection: 'news-posts',
      where: { project: { equals: ctx.project.id } },
      sort: '-createdAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })
    const posts: NewsItem[] = await Promise.all(
      res.docs.map(async (doc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = doc as any
        return {
          id: String(p.id),
          title: p.title ?? '',
          body: await lexicalToMarkdown(p.content),
          visibility: p.visibility ?? 'INTERNAL',
          publishedAt: p.publishedAt ?? null,
          featuredImageUrl: p.featuredImage && typeof p.featuredImage === 'object' ? (p.featuredImage.url ?? null) : null,
        }
      }),
    )
    return <NewsManager slug={slug} locale={locale} posts={posts} />
  }

  if (moduleType === 'calendar') {
    const res = await payload.find({
      collection: 'calendar-events',
      where: { project: { equals: ctx.project.id } },
      sort: 'startDate',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    })
    const events: EventItem[] = await Promise.all(
      res.docs.map(async (doc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = doc as any
        return {
          id: String(e.id),
          title: e.title ?? '',
          startDate: e.startDate,
          endDate: e.endDate ?? null,
          allDay: e.allDay ?? false,
          location: e.location ?? null,
          category: e.category ?? null,
          visibility: e.visibility ?? 'INTERNAL',
          body: await lexicalToMarkdown(e.content),
        }
      }),
    )
    return <CalendarManager slug={slug} locale={locale} events={events} />
  }

  if (moduleType === 'polls') {
    const res = await payload.find({
      collection: 'polls',
      where: { project: { equals: ctx.project.id } },
      sort: '-createdAt',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    const polls: PollItem[] = await Promise.all(
      res.docs.map(async (doc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = doc as any
        const [questions, votes] = await Promise.all([
          payload.count({ collection: 'poll-questions', where: { poll: { equals: p.id } }, overrideAccess: true }),
          payload.count({ collection: 'poll-votes', where: { poll: { equals: p.id } }, overrideAccess: true }),
        ])
        return {
          id: String(p.id),
          title: p.title,
          status: p.status ?? 'draft',
          questionCount: questions.totalDocs,
          voteCount: votes.totalDocs,
          closesAt: p.closesAt ?? null,
        }
      }),
    )
    return <PollsManager slug={slug} locale={locale} polls={polls} />
  }

  if (moduleType === 'forum') {
    const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
    const personName = (u: unknown): string => {
      if (!u || typeof u !== 'object') return 'Unbekannt'
      const o = u as { firstName?: string; lastName?: string; email?: string }
      return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
    }
    const threadsRes = await payload.find({ collection: 'forum-threads', where: { project: { equals: ctx.project.id } }, sort: '-createdAt', limit: 300, depth: 1, overrideAccess: true })
    const threadIdList = threadsRes.docs.map((t) => (t as { id: string | number }).id)
    const [commentsRes, votesRes] = threadIdList.length
      ? await Promise.all([
          payload.find({ collection: 'forum-comments', where: { thread: { in: threadIdList } }, sort: 'createdAt', limit: 100000, depth: 1, overrideAccess: true }),
          payload.find({ collection: 'forum-thread-votes', where: { thread: { in: threadIdList } }, limit: 100000, depth: 0, overrideAccess: true }),
        ])
      : [{ docs: [] as unknown[] }, { docs: [] as unknown[] }]
    const threadIds = new Set(threadIdList.map(String))
    const voteCount = new Map<string, number>()
    for (const v of votesRes.docs) { const th = relId((v as { thread?: unknown }).thread); if (th && threadIds.has(th)) voteCount.set(th, (voteCount.get(th) ?? 0) + 1) }
    const commentsByThread = new Map<string, ModThread['comments']>()
    for (const c of commentsRes.docs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cc = c as any
      const th = relId(cc.thread && typeof cc.thread === 'object' ? cc.thread.id ?? cc.thread : cc.thread)
      if (!th || !threadIds.has(th)) continue
      const arr = commentsByThread.get(th) ?? []
      arr.push({ id: String(cc.id), authorName: personName(cc.author), createdAt: cc.createdAt, html: lexicalToHtml(cc.content) })
      commentsByThread.set(th, arr)
    }
    const threads: ModThread[] = threadsRes.docs.map((doc) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = doc as any
      const id = String(t.id)
      return { id, slug: t.slug, title: t.title ?? '', authorName: personName(t.author), createdAt: t.createdAt, pinned: t.pinned === true, locked: t.locked === true, voteCount: voteCount.get(id) ?? 0, comments: commentsByThread.get(id) ?? [] }
    })
    threads.sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return <ForumModeration slug={slug} locale={locale} threads={threads} />
  }

  return (
    <ManagePlaceholder
      title={MODULE_LABELS[moduleType] ?? moduleType}
      hint="Die Inhaltsverwaltung für dieses Modul wird in einer späteren Phase ergänzt."
    />
  )
}
