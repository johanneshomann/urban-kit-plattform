// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth/getUser'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { ModuleConsumptionPlaceholder } from '@/components/platform/modules/ModuleConsumptionPlaceholder'
import { NewsFeed } from '@/components/platform/modules/news/NewsFeed'
import { CalendarFeed } from '@/components/platform/modules/calendar/CalendarFeed'
import { loadCitizenPolls } from '@/lib/citizen-polls'
import { PollsConsumption } from '@/components/platform/modules/polls/PollsConsumption'
import { ForumFeed } from '@/components/platform/modules/forum/ForumFeed'
import { FilesBrowse } from '@/components/platform/modules/files/FilesBrowse'
import { TaskBoardLoader } from '@/components/platform/modules/tasks/TaskBoardLoader'
import { UrbanAgentChat } from '@/components/platform/modules/urban-agent/UrbanAgentChat'
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

  // Shared with the shell layout via React.cache — one fetch per request.
  // The module-enabled check stays here (hard rule: gate server-side).
  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()
  const { project, modules } = ctx
  if (!modules.includes(moduleType)) notFound()

  const user = await getUser()
  const userId = user ? String(user.id) : null
  const viewerCtx = ctx.viewer
  const tier = viewerCtx.tier
  const membershipObj = ctx.membershipId
    ? { id: ctx.membershipId, status: ctx.membershipStatus, role: ctx.role, teams: ctx.teams }
    : null

  const citizenPolls = moduleType === 'polls' ? await loadCitizenPolls(payload, project.id, viewerCtx, userId) : []

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
    <div className="flex-1 min-w-0 flex flex-col" style={{ background: 'var(--project-light)' }}>
      <ProjectBreadcrumb
        items={[
          { label: project.title, href: `/${locale}/dashboard/projekte/${slug}` },
          { label: tm(moduleType) },
        ]}
      />
      {/* White content card under the light breadcrumb band — same pattern as manage */}
      <main className="card-in flex-1 mt-5 p-6 md:p-10 w-full min-w-0" style={{ background: 'var(--project-white)' }}>
        {moduleType === 'news'
          ? <NewsFeed slug={slug} locale={locale} projectId={project.id} viewer={viewerCtx} />
          : moduleType === 'calendar'
          ? <CalendarFeed slug={slug} locale={locale} projectId={project.id} viewer={viewerCtx} userId={userId} />
          : moduleType === 'polls'
          ? <PollsConsumption slug={slug} locale={locale} polls={citizenPolls} loginHref={`/${locale}/login`} />
          : moduleType === 'forum'
          ? (tier === 'public'
              ? <ModuleConsumptionPlaceholder title={tm('forum')} reason="membership" />
              : <ForumFeed slug={slug} locale={locale} projectId={project.id} userId={userId} viewer={viewerCtx} membership={membershipObj} />)
          : moduleType === 'files'
          ? <FilesBrowse projectId={project.id} viewer={viewerCtx} />
          : moduleType === 'tasks'
          ? (tier === 'public' || !userId
              ? <ModuleConsumptionPlaceholder title={tm('tasks')} reason="membership" />
              : <TaskBoardLoader slug={slug} locale={locale} projectId={project.id} userId={userId} viewer={viewerCtx} membership={membershipObj} />)
          : moduleType === 'urban-agent'
          ? (tier === 'public' || !userId
              ? <ModuleConsumptionPlaceholder title={tm('urban-agent')} reason="membership" />
              : <UrbanAgentChat projectId={project.id} projectSlug={project.slug} />)
          : moduleType === 'board'
          ? (!boardData
              ? <ModuleConsumptionPlaceholder title={tm('board')} reason="membership" />
              : <div className="h-[calc(100svh-14rem)] lg:h-[calc(100svh-11rem)] min-h-[24rem]"><BoardView boards={boardData.boards} projectSlug={slug} wsUrl={boardData.wsUrl} token={boardData.token} userId={userId!} userName={boardData.userName} /></div>)
          : <ModuleConsumptionPlaceholder title={tm(moduleType)} />}
      </main>
    </div>
  )
}
