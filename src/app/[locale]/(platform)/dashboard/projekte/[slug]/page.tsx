import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { House, Settings2, Newspaper, CalendarDays, BarChart2, MessageSquare, CheckSquare, MessageCircle, Kanban, FolderOpen, Bot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cookies } from 'next/headers'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { projectDefaults } from '@/lib/defaults/project'
import { resolveColorScheme } from '@/lib/colorScheme'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import { ProjectModuleNav } from '@/components/platform/ProjectModuleNav'
import { JoinProjectButton } from '@/components/platform/JoinProjectButton'
import { DraggableModuleGrid } from '@/components/platform/DraggableModuleGrid'
import { ProjectInfoAccordion } from '@/components/platform/ProjectInfoAccordion'

// ─── module registry ─────────────────────────────────────────────────────────

// Collections backing each module's count badge (modules without a badge omitted).
const MODULE_COLLECTIONS: Record<string, string> = {
  polls: 'polls',
  forum: 'forum-threads',
  tasks: 'tasks',
  chat: 'chat-rooms',
  board: 'board-canvases',
  files: 'file-uploads',
}

// ─── types ────────────────────────────────────────────────────────────────────

type NewsPost = {
  id: string
  title: string
  slug: string
  publishedAt?: string | null
}

type CalEvent = {
  id: string
  title: string
  startDate: string
  location?: string | null
}

type Project = {
  id: string
  title: string
  slug: string
  shortDescription?: string | null
  coverImage?: { url?: string } | null
  colorScheme?: string | null
  modules?: string[]
  projektphase?: string | null
  thema?: string[]
  gallery?: Array<{
    image?: { url?: string; alt?: string | null } | null
    caption?: string | null
    id?: string | null
  }> | null
  projektbeschreibung?: unknown
  beteiligungsvorhaben?: unknown
  startYear?: number | null
  altersgruppe?: string[] | null
  gender?: string[] | null
  stadtbereich?: string[] | null
  isPublic?: boolean | null
  joinRequestsEnabled?: boolean | null
  kontakt?: {
    email?: string | null
    telefon?: string | null
    website?: string | null
  } | null
  ansprechperson?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
}

const P = {
  white:  'var(--project-white)',
  light:  'var(--project-light)',
  mid:    'var(--project-mid)',
  dark:   'var(--project-dark)',
  accent: 'var(--project-accent)',
} as const

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [tw, tax] = await Promise.all([
    getTranslations({ locale, namespace: 'projectWorkspace' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
  ])
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  if (!result.docs[0]) notFound()
  const project = result.docs[0] as unknown as Project

  const modules: string[] = project.modules ?? ['news', 'calendar']
  const scheme = resolveColorScheme(project.colorScheme)
  const phase = PROJEKTPHASEN.find((p) => p.value === project.projektphase)
  const coverSrc = project.coverImage?.url ?? projectDefaults.coverImage

  const now = new Date().toISOString()

  const extraModules = modules.filter((m) => m !== 'news' && m !== 'calendar')

  const [newsResult, eventsResult] = await Promise.all([
    payload.find({
      collection: 'news-posts',
      where: { project: { equals: project.id } },
      sort: '-publishedAt',
      limit: 3,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'calendar-events',
      where: {
        and: [
          { project: { equals: project.id } },
          { startDate: { greater_than_equal: now } },
        ],
      },
      sort: 'startDate',
      limit: 3,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const newsPosts = newsResult.docs as unknown as NewsPost[]
  const calEvents = eventsResult.docs as unknown as CalEvent[]

  // Active polls — fetched separately so we have titles to display in the card
  const pollsResult = modules.includes('polls') ? await payload.find({
    collection: 'polls' as Parameters<typeof payload.find>[0]['collection'],
    where: { and: [{ project: { equals: project.id } }, { status: { equals: 'active' } }] },
    limit: 5,
    depth: 0,
    overrideAccess: true,
  }).catch(() => ({ docs: [] })) : { docs: [] }
  const activePolls = (pollsResult.docs as unknown as { id: string; title: string }[])

  // Fetch counts for extra modules individually — skip silently if collection isn't registered
  const moduleCountMap: Record<string, number> = {}
  const countableExtras = extraModules.filter((m) => MODULE_COLLECTIONS[m])
  await Promise.all(
    countableExtras.map(async (moduleId) => {
      try {
        const col = MODULE_COLLECTIONS[moduleId]! as Parameters<typeof payload.find>[0]['collection']
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = moduleId === 'polls'
          ? { and: [{ project: { equals: project.id } }, { status: { equals: 'active' } }] }
          : { project: { equals: project.id } }
        const result = await payload.find({ collection: col, where, limit: 0, depth: 0, overrideAccess: true })
        moduleCountMap[moduleId] = result.totalDocs
      } catch {
        moduleCountMap[moduleId] = 0
      }
    })
  )
  // Fetch current user's membership to read/restore saved module order
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  let membershipId: string | null = null
  let savedOrder: string[] | null = null
  let role: string | null = null
  let membershipStatus: string | null = null
  let isLoggedIn = false

  if (token) {
    const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
    if (me.user) {
      isLoggedIn = true
      const membershipResult = await payload.find({
        collection: 'project-memberships',
        where: {
          and: [
            { user: { equals: me.user.id } },
            { project: { equals: project.id } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const membership = membershipResult.docs[0] as { id: string; role?: string; status?: string; moduleOrder?: unknown } | undefined
      if (membership) {
        membershipId = membership.id
        role = membership.role ?? null
        membershipStatus = membership.status ?? null
        if (Array.isArray(membership.moduleOrder)) {
          savedOrder = membership.moduleOrder as string[]
        }
      }
    }
  }

  const canManage = role === 'PM' && membershipStatus === 'active'
  // Offer "Mitmachen" to logged-in users without an active membership (open
  // requests show their pending state; rejected users may ask again).
  const canRequestJoin =
    isLoggedIn &&
    membershipStatus !== 'active' &&
    project.joinRequestsEnabled !== false

  // Build ordered module list: use saved order if valid, otherwise use project module order
  const defaultOrder = modules
  const moduleOrder = savedOrder?.filter((id) => modules.includes(id)).length === modules.length
    ? savedOrder!
    : defaultOrder

  const themaList = (project.thema ?? []).filter(Boolean)

  // richText → HTML
  const beschreibungHtml = project.projektbeschreibung
    ? convertLexicalToHTML({ data: project.projektbeschreibung as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null
  const beteiligungsvorhabenHtml = project.beteiligungsvorhaben
    ? convertLexicalToHTML({ data: project.beteiligungsvorhaben as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null

  const accordionDetails = [
    project.startYear ? { label: tw('detailYear'), value: String(project.startYear) } : null,
    (project.stadtbereich ?? []).length > 0
      ? { label: tw('detailStadtbereich'), value: (project.stadtbereich ?? []).map((v) => tax(`stadtbereich.${v}`)).join(', ') }
      : null,
    (project.altersgruppe ?? []).length > 0
      ? { label: tw('detailAltersgruppe'), value: (project.altersgruppe ?? []).map((v) => tax(`altersgruppe.${v}`)).join(', ') }
      : null,
    (project.gender ?? []).length > 0
      ? { label: tw('detailZielgruppe'), value: (project.gender ?? []).map((v) => tax(`gender.${v}`)).join(', ') }
      : null,
    project.isPublic != null
      ? { label: tw('detailPublic'), value: project.isPublic ? tw('valueYes') : tw('valueNo') }
      : null,
    project.joinRequestsEnabled != null
      ? { label: tw('detailRequests'), value: project.joinRequestsEnabled ? tw('requestsOn') : tw('requestsOff') }
      : null,
  ].filter((d): d is { label: string; value: string } => d !== null)

  const galleryImages = (project.gallery ?? [])
    .filter((g) => !!g.image?.url)
    .map((g) => ({ url: g.image!.url!, alt: g.image?.alt ?? null, caption: g.caption ?? null }))

  const ansprechperson = project.ansprechperson
    ? [project.ansprechperson.firstName, project.ansprechperson.lastName].filter(Boolean).join(' ') ||
      project.ansprechperson.email ||
      null
    : null

  return (
    <>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '40vh', minHeight: '12rem' }}>
        <img
          src={coverSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${scheme.dark}f0 0%, ${scheme.dark}70 50%, ${scheme.dark}10 100%)`,
          }}
        />

        {/* back — icon only */}
        <Link
          href={`/${locale}/dashboard`}
          className="absolute top-4 left-5 transition-colors text-white/60 hover:text-white"
          style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))' }}
        >
          <House className="w-[1em] h-[1em]" />
        </Link>

      </div>

      {/* ── Title row ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4" style={{ background: P.white }}>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-title font-bold leading-tight" style={{ color: P.dark }}>
            {project.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            {phase && (
              <span
                className="text-small font-medium"
                style={{
                  color: P.accent,
                  background: 'color-mix(in srgb, var(--project-accent) 12%, transparent)',
                  border: `1.5px solid color-mix(in srgb, var(--project-accent) 30%, transparent)`,
                  padding: '0.3em 0.75em',
                  borderRadius: '999px',
                }}
              >
                {tw('phaseLabel', { step: phase.step + 1, label: tax(`phase.${phase.value}`) })}
              </span>
            )}
            {canManage && (
              <Link
                href={`/${locale}/dashboard/projekte/${slug}/manage`}
                className="flex items-center gap-1.5 text-small font-medium transition-colors hover:bg-[var(--project-accent)] hover:text-[var(--project-dark)] hover:border-[var(--project-accent)]"
                style={{
                  color: P.accent,
                  background: 'color-mix(in srgb, var(--project-accent) 12%, transparent)',
                  border: `1.5px solid color-mix(in srgb, var(--project-accent) 30%, transparent)`,
                  padding: '0.3em 0.75em',
                  borderRadius: '999px',
                }}
              >
                <Settings2 className="w-[0.9em] h-[0.9em] shrink-0" />
                {tw('manage')}
              </Link>
            )}
            {canRequestJoin && (
              <JoinProjectButton
                slug={slug}
                locale={locale}
                status={membershipStatus === 'requested' || membershipStatus === 'rejected' ? membershipStatus : null}
              />
            )}
          </div>
        </div>
        {project.shortDescription && (
          <p className="text-small mt-1.5 max-w-2xl" style={{ color: P.dark, opacity: 0.55 }}>
            {project.shortDescription}
          </p>
        )}
      </div>

      {/* ── Module nav strip ──────────────────────────────────────────────── */}
      <ProjectModuleNav modules={modules} slug={slug} locale={locale} />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div
        className="p-6 md:p-8 flex flex-col gap-6"
        style={{
          background: P.light,
          minHeight: 'calc(100svh - 14rem)',
        }}
      >

        {/* thema tags */}
        {themaList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {themaList.map((th) => (
              <span
                key={th}
                className="text-small px-2.5 py-0.5 rounded-full"
                style={{ background: P.white, border: `1px solid color-mix(in srgb, ${P.mid} 20%, transparent)`, color: P.dark, opacity: 0.8 }}
              >
                {tax(`thema.${th}`)}
              </span>
            ))}
          </div>
        )}

        {/* 2-col draggable module grid */}
        <DraggableModuleGrid
          initialOrder={moduleOrder}
          membershipId={membershipId}
          projectSlug={slug}
          locale={locale}
          newsPosts={newsPosts}
          calEvents={calEvents}
          moduleCountMap={moduleCountMap}
          activePolls={activePolls}
        />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'color-mix(in srgb, var(--project-accent) 20%, transparent)' }} />
          <span className="text-small font-medium" style={{ color: 'color-mix(in srgb, var(--project-accent) 60%, transparent)' }}>{tw('projectInfo')}</span>
          <div className="flex-1 h-px" style={{ background: 'color-mix(in srgb, var(--project-accent) 20%, transparent)' }} />
        </div>

        {/* Über das Projekt */}
        <ProjectInfoAccordion
          beschreibungHtml={beschreibungHtml}
          beteiligungsvorhabenHtml={beteiligungsvorhabenHtml}
          details={accordionDetails}
          kontakt={{ ...project.kontakt, ansprechperson }}
          galleryImages={galleryImages}
        />

      </div>
    </>
  )
}
