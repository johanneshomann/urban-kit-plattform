import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getTranslations } from 'next-intl/server'
import { resolveColorScheme } from '@/lib/colorScheme'
import { canViewContent, type ViewerMembership } from '@/lib/visibility'
import Link from 'next/link'
import { FolderKanban, Search, ChevronRight, ExternalLink, BarChart3, Calendar, Newspaper, MessageSquare, CheckSquare, MessageCircle, FolderOpen, Kanban, FileText } from 'lucide-react'

import { DashboardTopBar } from '@/components/platform/DashboardTopBar'
import { CtaButton } from '@/components/platform/CtaButton'
import { ProjectJoinButton } from '@/components/platform/ProjectJoinButton'
import { ProjectPillList } from '@/components/platform/ProjectPillList'

type Project = {
  id: string
  title: string
  slug: string
  shortDescription?: string | null
  modules?: string[]
  coverImage?: { url?: string } | null
  gallery?: { image?: { url?: string } | null }[] | null
  colorScheme?: string | null
  startYear?: number | null
  projektphase?: string | null
  members?: { docs?: { id: string }[]; totalDocs?: number } | null
}

type ActivityItem = {
  type: 'poll' | 'event' | 'news' | 'forum' | 'forumComment' | 'task' | 'taskDone' | 'chat' | 'file' | 'board' | 'newsComment'
  title: string
  projectTitle: string
  projectSlug: string
  projectId: string
  date?: string
  schemeGeneral: string
  schemeAccent: string
  schemeLight: string
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getUser()
  if (!user) return null

  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const roleLabels: Record<string, string> = {
    PM: t('rolePM'),
    Citizen: t('roleCitizen'),
  }

  const payload = await getPayload({ config })

  const [memberships, starredOnly] = await Promise.all([
    payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { status: { equals: 'active' } }] },
      sort: 'order',
      depth: 2,
      limit: 50,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { starred: { equals: true } }, { status: { not_equals: 'active' } }] },
      depth: 2,
      limit: 50,
      overrideAccess: true,
    }),
  ])

  /**
   * Projects the user is an active member of (PM or Citizen) — the horizontal bands.
   * Sorted by the `order` field so custom reordering persists.
   */
  const memberProjects = memberships.docs
    .map((m) => ({ membershipId: String(m.id), project: m.project as Project, role: (m.role ?? 'Citizen') as string }))
    .filter((x) => !!x.project)
  const memberIds = new Set(memberProjects.map((x) => x.project.id))

  // Build a per-project membership map for team-scoped visibility filtering.
  // Each active membership carries `teams` and `role` — used by canViewContent
  // to decide whether the user may see TEAM-scoped content.
  const membershipByProjectId: Record<string, ViewerMembership> = {}
  for (const m of memberships.docs) {
    const project = m.project as { id: string } | undefined
    if (project?.id) {
      membershipByProjectId[project.id] = {
        id: String(m.id),
        status: (m.status as string) ?? 'active',
        role: (m.role as string) ?? 'Citizen',
        teams: (m.teams as string[] | undefined) ?? [],
      }
    }
  }

  // Fetch the real member count for each project (the join field `members`
  // may not be populated by the depth query, so we count active memberships
  // directly).
  const memberCounts: Record<string, number> = {}
  try {
    for (const pid of memberIds) {
      const { totalDocs } = await payload.count({
        collection: 'project-memberships',
        where: { and: [{ project: { equals: pid } }, { status: { equals: 'active' } }] },
      })
      memberCounts[pid] = totalDocs
    }
  } catch {
    // Non-fatal — eyebrow just won't show a count
  }

  // All public projects (for the "Weitere Projekte" grid below).
  const allProjectsRes = await payload.find({
    collection: 'projects',
    where: { isPublic: { equals: true } },
    sort: '-createdAt',
    limit: 200,
    depth: 1,
    overrideAccess: true,
  })
  const allProjects = allProjectsRes.docs as unknown as Project[]
  const otherProjects = allProjects.filter((p) => !memberIds.has(p.id))
  // Starred-only memberships (non-active) also count as "other"/suggested — merge & de-dupe.
  const starredOther = starredOnly.docs.map((m) => m.project).filter(Boolean) as Project[]
  for (const sp of starredOther) {
    if (!memberIds.has(sp.id) && !otherProjects.some((o) => o.id === sp.id)) otherProjects.push(sp)
  }

  // Activity feed — polls, upcoming events, recent news, forum threads, tasks, chat, files, boards, comments
  let activityItems: ActivityItem[] = []
  try {
    const projectIds = memberProjects.map((x) => x.project.id)
    if (projectIds.length > 0) {
      const now = new Date().toISOString()
      const in14days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [pollsResult, eventsResult, newsResult, forumResult, forumCommentsResult, tasksResult, chatResult, filesResult, boardsResult, newsCommentsResult] = await Promise.all([
        // Active polls
        payload.find({
          collection: 'polls',
          where: { and: [{ project: { in: projectIds } }, { status: { equals: 'active' } }] },
          limit: 20, depth: 1, overrideAccess: true,
        }),
        // Upcoming calendar events (next 14 days)
        payload.find({
          collection: 'calendar-events',
          where: { and: [{ project: { in: projectIds } }, { startDate: { greater_than_equal: now } }, { startDate: { less_than_equal: in14days } }] },
          sort: 'startDate', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent news posts
        payload.find({
          collection: 'news-posts',
          where: { and: [{ project: { in: projectIds } }, { publishedAt: { greater_than_equal: last7days } }] },
          sort: '-publishedAt', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent forum threads
        payload.find({
          collection: 'forum-threads',
          where: { and: [{ project: { in: projectIds } }, { createdAt: { greater_than_equal: last7days } }] },
          sort: '-createdAt', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent forum comments (resolve project via thread)
        payload.find({
          collection: 'forum-comments',
          where: { createdAt: { greater_than_equal: last7days } },
          sort: '-createdAt', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent/updated tasks
        payload.find({
          collection: 'tasks',
          where: { and: [{ project: { in: projectIds } }, { updatedAt: { greater_than_equal: last7days } }] },
          sort: '-updatedAt', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent chat messages (resolve project via room)
        payload.find({
          collection: 'chat-messages',
          where: { createdAt: { greater_than_equal: last7days } },
          sort: '-createdAt', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent file uploads
        payload.find({
          collection: 'file-uploads',
          where: { and: [{ project: { in: projectIds } }, { createdAt: { greater_than_equal: last7days } }] },
          sort: '-createdAt', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent board updates
        payload.find({
          collection: 'board-canvases',
          where: { and: [{ project: { in: projectIds } }, { updatedAt: { greater_than_equal: last7days } }] },
          sort: '-updatedAt', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent news comments
        payload.find({
          collection: 'news-comments',
          where: { createdAt: { greater_than_equal: last7days } },
          sort: '-createdAt', limit: 20, depth: 1, overrideAccess: true,
        }),
      ])

      const projectById = Object.fromEntries(memberProjects.map((x) => [x.project.id, x.project]))
      const schemeFor = (p: Project) => resolveColorScheme(p.colorScheme)

      const toItem = (type: ActivityItem['type'], title: string, projectRaw: unknown, date?: string, doc?: { visibility?: string | null; visibilityTeams?: string[] | null }): ActivityItem | null => {
        const p = projectById[(projectRaw as { id: string })?.id ?? String(projectRaw)]
        if (!p) return null
        // Team-scoped visibility: only include if the user's membership for this
        // project grants access (PMs see all, team-tagged members see intersecting).
        const membership = membershipByProjectId[p.id]
        if (doc && !canViewContent(membership, doc)) return null
        const scheme = schemeFor(p)
        return { type, title, projectTitle: p.title, projectSlug: p.slug, projectId: p.id, date, schemeGeneral: scheme.general, schemeAccent: scheme.accent, schemeLight: scheme.light }
      }

      // Resolve project for forum comments (thread → project)
      const forumCommentItems = await Promise.all(
        forumCommentsResult.docs.map(async (d) => {
          const thread = d.thread as { id: string; project?: { id: string } } | undefined
          if (!thread?.project) return null
          return toItem('forumComment', d.thread as unknown as string, thread.project, d.createdAt as string)
        })
      )

      // Resolve project for chat messages (room → project)
      const chatItems = await Promise.all(
        chatResult.docs.map(async (d) => {
          const room = d.room as { id: string; project?: { id: string } } | undefined
          if (!room?.project) return null
          return toItem('chat', `"${(d.content as string)?.slice(0, 60)}"`, room.project, d.createdAt as string)
        })
      )

      // Resolve project for news comments (post → project)
      const newsCommentItems = await Promise.all(
        newsCommentsResult.docs.map(async (d) => {
          const post = d.post as { id: string; project?: { id: string } } | undefined
          if (!post?.project) return null
          return toItem('newsComment', d.post as unknown as string, post.project, d.createdAt as string)
        })
      )

      const items: (ActivityItem | null)[] = [
        ...pollsResult.docs.map((d) => toItem('poll', d.title as string, d.project, undefined, d as { visibility?: string | null; visibilityTeams?: string[] | null })),
        ...eventsResult.docs.map((d) => toItem('event', d.title as string, d.project, d.startDate as string, d as { visibility?: string | null; visibilityTeams?: string[] | null })),
        ...newsResult.docs.map((d) => toItem('news', d.title as string, d.project, d.publishedAt as string | undefined, d as { visibility?: string | null; visibilityTeams?: string[] | null })),
        ...forumResult.docs.map((d) => toItem('forum', d.title as string, d.project, d.createdAt as string, d as { visibility?: string | null; visibilityTeams?: string[] | null })),
        ...forumCommentItems,
        ...tasksResult.docs.map((d) => {
          const status = d.status as string
          const itemType = status === 'done' ? 'taskDone' : 'task'
          return toItem(itemType, d.title as string, d.project, d.updatedAt as string, d as { visibility?: string | null; visibilityTeams?: string[] | null })
        }),
        ...chatItems,
        ...filesResult.docs.map((d) => toItem('file', (d.label as string) ?? (d.filename as string), d.project, d.createdAt as string, d as { visibility?: string | null; visibilityTeams?: string[] | null })),
        ...boardsResult.docs.map((d) => toItem('board', d.name as string, d.project, d.updatedAt as string, d as { visibility?: string | null; visibilityTeams?: string[] | null })),
        ...newsCommentItems,
      ]

      // Filter nulls, sort by date descending, cap at 30
      activityItems = items
        .filter((i): i is ActivityItem => i !== null)
        .sort((a, b) => {
          const da = a.date ? new Date(a.date).getTime() : Date.now()
          const db = b.date ? new Date(b.date).getTime() : Date.now()
          return db - da
        })
        .slice(0, 30)
    }
  } catch {
    // Non-fatal — feed just shows empty
  }

  // Group activity items by project for the coloured section display
  const groupedByProject = activityItems.reduce<Record<string, { project: Project; items: ActivityItem[] }>>((acc, item) => {
    if (!acc[item.projectId]) {
      const p = memberProjects.find((x) => x.project.id === item.projectId)?.project
      if (!p) return acc
      acc[item.projectId] = { project: p, items: [] }
    }
    acc[item.projectId].items.push(item)
    return acc
  }, {})

  // Dynamic height: 1–2 projects get a generous max, more projects get smaller
  // but never below 200px so content always fits.
  const memberRowHeight = memberProjects.length <= 2
    ? '50vh'
    : `max(200px, ${Math.round(70 / memberProjects.length)}vh)`

  const firstName = ((user as unknown as { firstName?: string | null }).firstName) ?? null
  const lastName = ((user as unknown as { lastName?: string | null }).lastName) ?? null
  const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName ?? lastName ?? null

  // Icon map for activity types
  const activityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'poll': return <BarChart3 className="h-4 w-4" />
      case 'event': return <Calendar className="h-4 w-4" />
      case 'news': return <Newspaper className="h-4 w-4" />
      case 'forum': case 'forumComment': return <MessageSquare className="h-4 w-4" />
      case 'task': case 'taskDone': return <CheckSquare className="h-4 w-4" />
      case 'chat': return <MessageCircle className="h-4 w-4" />
      case 'file': return <FolderOpen className="h-4 w-4" />
      case 'board': return <Kanban className="h-4 w-4" />
      case 'newsComment': return <FileText className="h-4 w-4" />
    }
  }

  // Activity label via i18n
  const activityLabel = (item: ActivityItem, t: Awaited<ReturnType<typeof getTranslations>>) => {
    switch (item.type) {
      case 'poll': return t('activityPoll', { title: item.title })
      case 'event': return t('activityEvent', { title: item.title })
      case 'news': return t('activityNews', { title: item.title })
      case 'forum': return t('activityForum', { title: item.title })
      case 'forumComment': return t('activityForumComment', { title: item.title })
      case 'task': return t('activityTask', { title: item.title })
      case 'taskDone': return t('activityTaskDone', { title: item.title })
      case 'chat': return t('activityChat', { title: item.title })
      case 'file': return t('activityFile', { title: item.title })
      case 'board': return t('activityBoard', { title: item.title })
      case 'newsComment': return t('activityNewsComment', { title: item.title })
    }
  }

  return (
    <div className="flex flex-col" style={{ color: 'var(--plattform-ink)' }}>
      <DashboardTopBar userName={userName} />

      {/* ── Meine Projekte (horizontal bands, image right, colour left) ──── */}
      {memberProjects.length === 0 ? (
        <section aria-labelledby="empty-section" className="p-10">
          <div
            className="rounded-xl border border-dashed p-10 text-center"
            style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
          >
            <FolderKanban className="w-8 h-8 mx-auto mb-3 opacity-20" aria-hidden />
            <p className="text-small font-medium opacity-50">{t('emptyTitle')}</p>
            <p className="text-small mt-1 opacity-30">{t('emptyBody')}</p>
            <div className="mt-4">
              <CtaButton
                href={`/${locale}/bereich/projekte-archiv/alle-projekte`}
                label={t('discoverProjects')}
                icon={<Search />}
                newTab
              />
            </div>
          </div>
        </section>
      ) : (
        <ProjectPillList
          projects={memberProjects.map(({ membershipId, project, role }) => ({
            membershipId,
            projectId: project.id,
            title: project.title,
            slug: project.slug,
            role,
            coverImageUrl: project.coverImage?.url ?? null,
            colorScheme: project.colorScheme ?? null,
            startYear: project.startYear ?? undefined,
            projektphase: project.projektphase ?? undefined,
            memberCount: memberCounts[project.id] ?? project.members?.totalDocs ?? 0,
          }))}
          roleLabels={roleLabels}
          locale={locale}
          tOpenWorkspace={t('openWorkspace')}
          tManageProject={t('manageProject')}
          rowHeight={memberRowHeight}
        />
      )}

      {/* ── Neues aus den Projekten (activity feed, grouped by project with project colours) ── */}
      {activityItems.length > 0 && (
        <section
          aria-labelledby="activity-heading"
          className="px-6 md:px-10 py-10"
        >
          <h2 id="activity-heading" className="text-small font-semibold uppercase tracking-wide opacity-50 mb-8">
            {t('activityHeading')}
          </h2>

          {/* Render each project group */}
          {Object.entries(groupedByProject).map(([projectId, { project, items }]) => {
            const scheme = resolveColorScheme(project.colorScheme)
            return (
              <div key={projectId} className="mb-8 last:mb-0">
                {/* Project section header with accent bar + project name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-6 w-1 rounded-full shrink-0"
                    style={{ background: scheme.accent }}
                  />
                  <h3
                    className="font-semibold leading-tight"
                    style={{ color: scheme.accent }}
                  >
                    {project.title}
                  </h3>
                </div>

                {/* Activity items for this project */}
                <ul className="flex flex-col gap-2" role="list">
                  {items.map((item, i) => (
                    <li key={`${item.type}-${item.title}-${i}`}>
                      <Link
                        href={`/${locale}/dashboard/projekte/${item.projectSlug}`}
                        className="flex items-start gap-3 py-2 px-3 rounded-lg transition-colors hover:bg-[var(--hover-bg)]"
                        style={{
                          color: 'var(--plattform-ink)',
                          // Hover tint uses the project's light colour. CSS, not
                          // handlers — this page is a server component, and event
                          // handlers cannot cross the RSC boundary.
                          ['--hover-bg' as string]: `color-mix(in srgb, ${item.schemeLight} 60%, transparent)`,
                        }}
                      >
                        {/* Icon chip with project colours */}
                        <span
                          className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md mt-0.5"
                          style={{ background: item.schemeGeneral, color: item.schemeAccent }}
                          aria-hidden="true"
                        >
                          {activityIcon(item.type)}
                        </span>
                        <div className="min-w-0">
                          <p
                            className="text-text font-medium leading-snug"
                            style={{ color: 'var(--plattform-ink-accent)' }}
                          >
                            {activityLabel(item, t)}
                          </p>
                          <p
                            className="text-small mt-0.5"
                            style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}
                          >
                            {t('activityInProject', { project: item.projectTitle })}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </section>
      )}

      {/* ── Weitere Projekte entdecken (accessible cards, always visible) ──── */}
      {/* Fades from plattform-light (grey) above → white → back to grey below,
          matching the landing-page section-fade pattern. */}
      {otherProjects.length > 0 && (
        <section
          aria-labelledby="discover-heading"
          className="pt-16 pb-32 md:pt-24 md:pb-48 px-6 md:px-10"
          style={{
            background: `linear-gradient(to bottom, var(--plattform-light) 0%, var(--plattform-white) var(--section-fade-height), var(--plattform-white) calc(100% - var(--section-fade-height)), var(--plattform-light) 100%)`,
          }}
        >
          <h2 id="discover-heading" className="text-small font-semibold uppercase tracking-wide opacity-50 mb-5">
            {t('sectionOtherProjects')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherProjects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col rounded-xl overflow-hidden border shadow-sm"
                style={{
                  borderColor: 'color-mix(in srgb, var(--plattform-ink) 12%, transparent)',
                  background: 'var(--plattform-white)',
                }}
              >
                {/* Cover thumbnail */}
                <div
                  className="relative w-full h-40 overflow-hidden"
                  style={{ background: 'var(--plattform-light)' }}
                >
                  {p.coverImage?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage.url}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col p-4 gap-2">
                  <h3
                    className="text-text font-bold leading-snug"
                    style={{ color: 'var(--plattform-ink-accent)' }}
                  >
                    {p.title}
                  </h3>
                  {p.shortDescription && (
                    <p
                      className="text-small line-clamp-2 flex-1"
                      style={{ color: 'var(--plattform-ink)', opacity: 0.65 }}
                    >
                      {p.shortDescription}
                    </p>
                  )}

                  {/* Always-visible actions */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Link
                      href={`/${locale}/projekte/${p.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-small font-medium border transition-colors hover:bg-[color-mix(in_srgb,var(--plattform-ink)_5%,transparent)]"
                      style={{
                        color: 'var(--plattform-ink)',
                        borderColor: 'color-mix(in srgb, var(--plattform) 35%, transparent)',
                        minHeight: 44,
                      }}
                    >
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      {t('openProject')}
                    </Link>
                    <ProjectJoinButton slug={p.slug} locale={locale} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-10 text-center">
        <Link
          href={`/${locale}/bereich/projekte-archiv/alle-projekte`}
          className="inline-flex items-center gap-1 text-small font-medium transition-colors text-[var(--plattform)] hover:text-[var(--plattform-accent)]"
          style={{ minHeight: 44 }}
        >
          {t('discoverAll')} <ChevronRight className="w-[0.9em] h-[0.9em] shrink-0" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}