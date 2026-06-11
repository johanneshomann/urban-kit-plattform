import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { MODULE_LABELS } from '@/lib/options/modules'
import { ManagePlaceholder } from '@/components/platform/manage/ManagePlaceholder'
import { NewsManager, type NewsItem } from '@/components/platform/manage/NewsManager'
import { CalendarManager, type EventItem } from '@/components/platform/manage/CalendarManager'
import { PollsManager, type PollItem } from '@/components/platform/manage/PollsManager'

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
      depth: 0,
      overrideAccess: true,
    })
    const posts = res.docs as unknown as NewsItem[]
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
    const events = res.docs as unknown as EventItem[]
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

  return (
    <ManagePlaceholder
      title={MODULE_LABELS[moduleType] ?? moduleType}
      hint="Die Inhaltsverwaltung für dieses Modul wird in einer späteren Phase ergänzt."
    />
  )
}
