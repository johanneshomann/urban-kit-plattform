import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getTranslations } from 'next-intl/server'
import { resolveColorScheme } from '@/lib/colorScheme'
import { canViewContent } from '@/lib/visibility'
import type { ViewerMembership } from '@/lib/visibility'
import Link from 'next/link'
import { FolderKanban, Search, ChevronRight } from 'lucide-react'

import { DashboardTopBar } from '@/components/platform/DashboardTopBar'
import { CtaButton } from '@/components/platform/CtaButton'
import { ProjectPillList } from '@/components/platform/ProjectPillList'
import { ActivityFeed } from '@/components/platform/dashboard/ActivityFeed'
import { AllProjectsSection } from '@/components/platform/dashboard/AllProjectsSection'

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
  status?: string | null
  thema?: string[] | null
  stadtbereich?: string[] | null
  createdAt?: string | null
  members?: { docs?: { id: string }[]; totalDocs?: number } | null
}

type ActivityItem = {
  type: 'poll' | 'pollActivated' | 'event' | 'eventSoon' | 'news' | 'forum' | 'forumComment' | 'threadPinned' | 'threadLocked' | 'task' | 'taskDone' | 'taskAssigned' | 'taskDueSoon' | 'file' | 'board' | 'newsComment' | 'memberJoined'
  title: string
  projectTitle: string
  projectSlug: string
  projectId: string
  date?: string
  schemeGeneral: string
  schemeAccent: string
  schemeLight: string
  schemeDark: string
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
      const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [pollsResult, eventsResult, newsResult, forumResult, forumCommentsResult, tasksResult, filesResult, boardsResult, newsCommentsResult, pollsActivatedResult, taskAssigneesResult, tasksDueSoonResult, membersJoinedResult, forumThreadsUpdatedResult] = await Promise.all([
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
        // Recent forum comments (scoped via the parent thread's project)
        payload.find({
          collection: 'forum-comments',
          where: { and: [{ 'thread.project': { in: projectIds } }, { createdAt: { greater_than_equal: last7days } }] },
          sort: '-createdAt', limit: 20, depth: 1, overrideAccess: true,
        }),
        // Recent/updated tasks
        payload.find({
          collection: 'tasks',
          where: { and: [{ project: { in: projectIds } }, { updatedAt: { greater_than_equal: last7days } }] },
          sort: '-updatedAt', limit: 20, depth: 1, overrideAccess: true,
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
          where: { and: [{ project: { in: projectIds } }, { createdAt: { greater_than_equal: last7days } }] },
          sort: '-createdAt', limit: 20, depth: 1, overrideAccess: true,
        }),

        // ── NEW: Polls just activated (status → active in last 7 days) ──
        payload.find({
          collection: 'polls',
          where: { and: [{ project: { in: projectIds } }, { status: { equals: 'active' } }, { updatedAt: { greater_than_equal: last7days } }] },
          sort: '-updatedAt', limit: 20, depth: 1, overrideAccess: true,
        }),

        // ── NEW: Tasks assigned to me ──
        payload.find({
          collection: 'task-assignees',
          where: { and: [{ user: { equals: user.id } }, { createdAt: { greater_than_equal: last7days } }] },
          sort: '-createdAt', limit: 20, depth: 1, overrideAccess: true,
        }),

        // ── NEW: Tasks due soon (deadline within 3 days, not done) ──
        payload.find({
          collection: 'tasks',
          where: { and: [{ project: { in: projectIds } }, { deadline: { greater_than_equal: now } }, { deadline: { less_than_equal: in3days } }, { status: { not_equals: 'done' } }] },
          sort: 'deadline', limit: 20, depth: 1, overrideAccess: true,
        }),

        // ── NEW: Members joined (active memberships in last 7 days, excluding self) ──
        payload.find({
          collection: 'project-memberships',
          where: { and: [{ project: { in: projectIds } }, { status: { equals: 'active' } }, { updatedAt: { greater_than_equal: last7days } }, { user: { not_equals: user.id } }] },
          sort: '-updatedAt', limit: 20, depth: 2, overrideAccess: true,
        }),

        // ── NEW: Forum threads updated (pinned/locked toggled) ──
        payload.find({
          collection: 'forum-threads',
          where: { and: [{ project: { in: projectIds } }, { updatedAt: { greater_than_equal: last7days } }, { or: [{ pinned: { equals: true } }, { locked: { equals: true } }] }] },
          sort: '-updatedAt', limit: 20, depth: 1, overrideAccess: true,
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
        return { type, title, projectTitle: p.title, projectSlug: p.slug, projectId: p.id, date, schemeGeneral: scheme.general, schemeAccent: scheme.accent, schemeLight: scheme.light, schemeDark: scheme.dark }
      }

      type VisibilityDoc = { visibility?: string | null; visibilityTeams?: string[] | null }
      // Each candidate carries a dedupe key for its underlying document, so a
      // doc matched by several queries (active poll + just activated, task
      // updated + due soon, …) fills only one of the 30 feed slots. First
      // occurrence wins — specific/urgent types must be listed before their
      // generic twin in `candidates` below.
      type Candidate = { key: string; item: ActivityItem | null }

      // Resolve project for forum comments (thread → project); visibility is the
      // parent thread's. Keyed per thread so a comment burst fills one slot.
      const forumCommentItems: Candidate[] = forumCommentsResult.docs.map((d) => {
        const thread = d.thread as ({ id: string; title?: string; project?: { id: string } } & VisibilityDoc) | undefined
        if (!thread?.project) return { key: '', item: null }
        return { key: `forumComment:${thread.id}`, item: toItem('forumComment', thread.title ?? '', thread.project, d.createdAt as string, thread) }
      })

      // Resolve project for news comments (post → project); visibility is the post's.
      const newsCommentItems: Candidate[] = newsCommentsResult.docs.map((d) => {
        const post = d.post as ({ id: string; title?: string; project?: { id: string } } & VisibilityDoc) | undefined
        if (!post?.project) return { key: '', item: null }
        return { key: `newsComment:${post.id}`, item: toItem('newsComment', post.title ?? '', post.project, d.createdAt as string, post) }
      })

      // Resolve task title for task-assignee items; visibility is the task's.
      const taskAssigneeItems: Candidate[] = taskAssigneesResult.docs.map((d) => {
        const task = d.task as ({ id: string; title?: string; project?: { id: string } } & VisibilityDoc) | undefined
        if (!task?.project) return { key: '', item: null }
        return { key: `task:${task.id}`, item: toItem('taskAssigned', task.title ?? '', task.project, d.createdAt as string, task) }
      })

      // Resolve user name for member-joined items (membership events carry no
      // content visibility — every member may see who joined).
      const memberJoinedItems: Candidate[] = membersJoinedResult.docs.map((d) => {
        const memberUser = d.user as { id: string; firstName?: string; lastName?: string } | undefined
        const project = d.project as { id: string } | undefined
        if (!project) return { key: '', item: null }
        const name = memberUser ? [memberUser.firstName, memberUser.lastName].filter(Boolean).join(' ') : 'Unbekannt'
        return { key: `membership:${String(d.id)}`, item: toItem('memberJoined', name, project, d.updatedAt as string) }
      })

      // Events happening soon (within 3 days) — separate from the 14-day view
      const eventSoonItems: Candidate[] = eventsResult.docs
        .filter((d) => new Date(d.startDate as string) <= new Date(in3days))
        .map((d) => ({ key: `event:${String(d.id)}`, item: toItem('eventSoon', d.title as string, d.project, d.startDate as string, d as VisibilityDoc) }))

      // Polls just activated — use 'pollActivated' type
      const pollActivatedItems: Candidate[] = pollsActivatedResult.docs
        .map((d) => ({ key: `poll:${String(d.id)}`, item: toItem('pollActivated', d.title as string, d.project, d.updatedAt as string, d as VisibilityDoc) }))

      // Tasks due soon
      const taskDueSoonItems: Candidate[] = tasksDueSoonResult.docs
        .map((d) => ({ key: `task:${String(d.id)}`, item: toItem('taskDueSoon', d.title as string, d.project, d.deadline as string, d as VisibilityDoc) }))

      // Pin/lock announcements; visibility is the thread's own.
      const forumUpdatedItems: Candidate[] = forumThreadsUpdatedResult.docs.map((d) => {
        const type: ActivityItem['type'] = d.pinned ? 'threadPinned' : 'threadLocked'
        return { key: `thread:${String(d.id)}`, item: toItem(type, d.title as string, d.project, d.updatedAt as string, d as VisibilityDoc) }
      })

      // Specific/urgent types first — they win the dedupe over their generic twin.
      const candidates: Candidate[] = [
        ...taskAssigneeItems,
        ...taskDueSoonItems,
        ...eventSoonItems,
        ...pollActivatedItems,
        ...forumResult.docs.map((d) => ({ key: `thread:${String(d.id)}`, item: toItem('forum', d.title as string, d.project, d.createdAt as string, d as VisibilityDoc) })),
        ...forumUpdatedItems,
        ...pollsResult.docs.map((d) => ({ key: `poll:${String(d.id)}`, item: toItem('poll', d.title as string, d.project, d.createdAt as string | undefined, d as VisibilityDoc) })),
        ...eventsResult.docs.map((d) => ({ key: `event:${String(d.id)}`, item: toItem('event', d.title as string, d.project, d.startDate as string, d as VisibilityDoc) })),
        ...newsResult.docs.map((d) => ({ key: `news:${String(d.id)}`, item: toItem('news', d.title as string, d.project, d.publishedAt as string | undefined, d as VisibilityDoc) })),
        ...forumCommentItems,
        ...tasksResult.docs.map((d) => {
          const itemType: ActivityItem['type'] = (d.status as string) === 'done' ? 'taskDone' : 'task'
          return { key: `task:${String(d.id)}`, item: toItem(itemType, d.title as string, d.project, d.updatedAt as string, d as VisibilityDoc) }
        }),
        ...filesResult.docs.map((d) => ({ key: `file:${String(d.id)}`, item: toItem('file', (d.label as string) ?? (d.filename as string), d.project, d.createdAt as string, d as VisibilityDoc) })),
        ...boardsResult.docs.map((d) => ({ key: `board:${String(d.id)}`, item: toItem('board', d.name as string, d.project, d.updatedAt as string, d as VisibilityDoc) })),
        ...newsCommentItems,
        ...memberJoinedItems,
      ]

      // One slot per document; undated items sort as oldest, not newest.
      const seenDocs = new Set<string>()
      activityItems = candidates
        .filter((c): c is { key: string; item: ActivityItem } => {
          if (!c.item || seenDocs.has(c.key)) return false
          seenDocs.add(c.key)
          return true
        })
        .map((c) => c.item)
        .sort((a, b) => {
          const da = a.date ? new Date(a.date).getTime() : 0
          const db = b.date ? new Date(b.date).getTime() : 0
          return db - da
        })
        .slice(0, 30)
    }
  } catch {
    // Non-fatal — feed just shows empty
  }

  // Dynamic height: 1–2 projects get a generous max, more projects get smaller
  // but never below 200px so content always fits. The pill list paginates at
  // 4 per page, so the divisor caps there.
  const memberRowHeight = memberProjects.length <= 2
    ? '50vh'
    : `max(200px, ${Math.round(70 / Math.min(memberProjects.length, 4))}vh)`

  const firstName = ((user as unknown as { firstName?: string | null }).firstName) ?? null
  const lastName = ((user as unknown as { lastName?: string | null }).lastName) ?? null
  const userName = firstName && lastName ? `${firstName} ${lastName}` : firstName ?? lastName ?? null

  return (
    <div className="flex flex-col" style={{ color: 'var(--app-ink)' }}>
      <DashboardTopBar userName={userName} />

      {/* ── Meine Projekte (horizontal bands, image right, colour left) ──── */}
      {memberProjects.length === 0 ? (
        <section aria-labelledby="empty-section" className="p-10">
          <div
            className="rounded-xl border border-dashed p-10 text-center"
            style={{ borderColor: 'color-mix(in srgb, var(--app-ink) 20%, transparent)' }}
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

      {/* ── Neues aus den Projekten (interactive activity feed with sort toggle) ── */}
      <ActivityFeed
        items={activityItems}
        projects={memberProjects.map((p) => ({ id: p.project.id, title: p.project.title }))}
        locale={locale}
      />

      {/* ── Weitere Projekte entdecken (accessible cards, always visible) ──── */}
      {/* Fades from plattform-light (grey) above → white → back to grey below,
          matching the landing-page section-fade pattern. */}
      {otherProjects.length > 0 && (
        <section
          aria-labelledby="discover-heading"
          className="pt-16 pb-32 md:pt-24 md:pb-48 px-6 md:px-10"
          style={{
            background: `linear-gradient(to bottom, var(--app-light) 0%, var(--app-white) var(--section-fade-height), var(--app-white) calc(100% - var(--section-fade-height)), var(--app-light) 100%)`,
          }}
        >
          <h2 id="discover-heading" className="text-small font-semibold uppercase tracking-wide opacity-50 mb-5">
            {t('sectionOtherProjects')}
          </h2>
          <AllProjectsSection
            projects={otherProjects.map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              shortDescription: p.shortDescription ?? null,
              status: p.status ?? null,
              thema: p.thema ?? null,
              stadtbereich: p.stadtbereich ?? null,
              startYear: p.startYear ?? null,
              createdAt: p.createdAt ?? null,
              coverImageUrl: p.coverImage?.url ?? null,
            }))}
            locale={locale}
          />
        </section>
      )}

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-10 text-center">
        <Link
          href={`/${locale}/bereich/projekte-archiv/alle-projekte`}
          className="inline-flex items-center gap-1 text-small font-medium transition-colors text-[var(--app-accent)] hover:text-[var(--app-ink-accent)]"
          style={{ minHeight: 44 }}
        >
          {t('discoverAll')} <ChevronRight className="w-[0.9em] h-[0.9em] shrink-0" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}