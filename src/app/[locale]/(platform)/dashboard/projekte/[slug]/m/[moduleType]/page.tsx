import { getPayload } from 'payload'
import config from '@payload-config'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth/getUser'
import { getViewerTier } from '@/lib/visibility'
import { ProjectModuleNav } from '@/components/platform/ProjectModuleNav'
import { ModuleConsumptionPlaceholder } from '@/components/platform/modules/ModuleConsumptionPlaceholder'
import { NewsFeed } from '@/components/platform/modules/news/NewsFeed'
import { CalendarFeed } from '@/components/platform/modules/calendar/CalendarFeed'
import { loadCitizenPolls } from '@/lib/citizen-polls'
import { PollsConsumption } from '@/components/platform/modules/polls/PollsConsumption'
import { ForumFeed } from '@/components/platform/modules/forum/ForumFeed'
import { FilesBrowse } from '@/components/platform/modules/files/FilesBrowse'
import { TaskBoardLoader } from '@/components/platform/modules/tasks/TaskBoardLoader'
import { UrbanAgentChat } from '@/components/platform/modules/urban-agent/UrbanAgentChat'
import { ChatLayout } from '@/components/platform/chat/ChatLayout'
import { ensureProjectRoomMemberships } from '@/lib/chat/access'
import { BoardView, type BoardRef } from '@/components/platform/board/BoardView'
import { cookies } from 'next/headers'

export default async function ModulePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; moduleType: string }>
}) {
  const { locale, slug, moduleType } = await params
  const tm = await getTranslations({ locale, namespace: 'modules' })
  const payload = await getPayload({ config })

  const projectResult = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (projectResult.totalDocs === 0) notFound()
  const project = projectResult.docs[0] as unknown as { id: string; title: string; modules?: string[] }

  const modules = project.modules ?? ['news', 'calendar']
  if (!modules.includes(moduleType)) notFound()

  const user = await getUser()
  const userId = user ? String(user.id) : null
  const tier = await getViewerTier(payload, userId, project.id)

  const citizenPolls = moduleType === 'polls' ? await loadCitizenPolls(payload, project.id, tier, userId) : []

  // Auto-join project members to existing project rooms when they open chat
  if (moduleType === 'chat' && tier !== 'public' && userId) {
    await ensureProjectRoomMemberships(payload, project.id, userId)
  }

  // Board needs the project's canvases + a WS token (the user's Payload JWT)
  let boardData: { boards: BoardRef[]; token: string; wsUrl: string; userName: string } | null = null
  if (moduleType === 'board' && tier !== 'public' && userId && user) {
    const res = await payload.find({ collection: 'board-canvases', where: { project: { equals: project.id } }, sort: '-createdAt', limit: 200, depth: 0, overrideAccess: true })
    const boards: BoardRef[] = res.docs.map((d) => { const b = d as { id: string | number; name?: string | null }; return { id: String(b.id), name: b.name ?? 'Board' } })
    const token = (await cookies()).get('payload-token')?.value ?? ''
    const u = user as { firstName?: string | null; lastName?: string | null; email?: string }
    const userName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || 'Teilnehmer:in'
    boardData = { boards, token, wsUrl: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ?? 'ws://localhost:1234', userName }
  }

  return (
    <div>
      <ProjectModuleNav modules={modules} slug={slug} locale={locale} activeModule={moduleType} />
      <main className="p-6 md:p-8 max-w-4xl mx-auto w-full" style={{ minHeight: 'calc(100svh - 8rem)' }}>
        {moduleType === 'news'
          ? <NewsFeed slug={slug} locale={locale} projectId={project.id} tier={tier} />
          : moduleType === 'calendar'
          ? <CalendarFeed slug={slug} locale={locale} projectId={project.id} tier={tier} userId={userId} />
          : moduleType === 'polls'
          ? <PollsConsumption slug={slug} locale={locale} polls={citizenPolls} loginHref={`/${locale}/login`} />
          : moduleType === 'forum'
          ? (tier === 'public'
              ? <ModuleConsumptionPlaceholder title={tm('forum')} />
              : <ForumFeed slug={slug} locale={locale} projectId={project.id} userId={userId} />)
          : moduleType === 'files'
          ? <FilesBrowse projectId={project.id} tier={tier} />
          : moduleType === 'tasks'
          ? (tier !== 'team' || !userId
              ? <ModuleConsumptionPlaceholder title={tm('tasks')} />
              : <TaskBoardLoader slug={slug} locale={locale} projectId={project.id} userId={userId} />)
          : moduleType === 'urban-agent'
          ? (tier === 'public' || !userId
              ? <ModuleConsumptionPlaceholder title={tm('urban-agent')} />
              : <UrbanAgentChat projectId={project.id} />)
          : moduleType === 'chat'
          ? (tier === 'public' || !userId
              ? <ModuleConsumptionPlaceholder title={tm('chat')} />
              : <div className="h-[calc(100svh-12rem)]"><ChatLayout projectSlug={slug} canCreateGroups={false} /></div>)
          : moduleType === 'board'
          ? (!boardData
              ? <ModuleConsumptionPlaceholder title={tm('board')} />
              : <div className="h-[calc(100svh-12rem)]"><BoardView boards={boardData.boards} projectSlug={slug} wsUrl={boardData.wsUrl} token={boardData.token} userId={userId!} userName={boardData.userName} /></div>)
          : <ModuleConsumptionPlaceholder title={tm(moduleType)} />}
      </main>
    </div>
  )
}
