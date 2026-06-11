import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
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

type ModuleMeta = {
  label: string
  icon: LucideIcon
  collection?: string
  countLabel: (n: number) => string
}

const MODULE_META: Record<string, ModuleMeta> = {
  news:          { label: 'News',        icon: Newspaper,      countLabel: () => '' },
  calendar:      { label: 'Kalender',    icon: CalendarDays,   countLabel: () => '' },
  polls:         { label: 'Umfragen',    icon: BarChart2,      collection: 'polls',          countLabel: (n) => n === 0 ? 'Keine aktiven Umfragen'  : `${n} aktive ${n === 1 ? 'Umfrage' : 'Umfragen'}` },
  forum:         { label: 'Forum',       icon: MessageSquare,  collection: 'forum-threads',  countLabel: (n) => n === 0 ? 'Keine Beiträge'           : `${n} ${n === 1 ? 'Beitrag' : 'Beiträge'}` },
  tasks:         { label: 'Aufgaben',    icon: CheckSquare,    collection: 'tasks',          countLabel: (n) => n === 0 ? 'Keine Aufgaben'           : `${n} ${n === 1 ? 'Aufgabe' : 'Aufgaben'}` },
  chat:          { label: 'Chat',        icon: MessageCircle,  collection: 'chat-channels',  countLabel: (n) => n === 0 ? 'Keine Kanäle'             : `${n} ${n === 1 ? 'Kanal' : 'Kanäle'}` },
  board:         { label: 'Board',       icon: Kanban,         collection: 'board-canvases', countLabel: (n) => n === 0 ? 'Kein Board'               : `${n} ${n === 1 ? 'Board' : 'Boards'}` },
  files:         { label: 'Dateien',     icon: FolderOpen,     collection: 'file-uploads',   countLabel: (n) => n === 0 ? 'Keine Dateien'            : `${n} ${n === 1 ? 'Datei' : 'Dateien'}` },
  'urban-agent': { label: 'Urban Agent', icon: Bot,            countLabel: () => '' },
}

const THEMA_LABELS: Record<string, string> = {
  mobilitaet:      'Mobilität',
  wohnraum:        'Wohnraum',
  gruenflaechen:   'Grünflächen',
  infrastruktur:   'Infrastruktur',
  stadtentwicklung:'Stadtentwicklung',
  kultur:          'Kultur',
  bildung:         'Bildung',
  umwelt:          'Umwelt',
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
  const countableExtras = extraModules.filter((m) => MODULE_META[m]?.collection)
  await Promise.all(
    countableExtras.map(async (moduleId) => {
      try {
        const col = MODULE_META[moduleId]!.collection as Parameters<typeof payload.find>[0]['collection']
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

  const ALTERSGRUPPE_LABELS: Record<string, string> = {
    kinder: 'Kinder (0–12)', jugendliche: 'Jugendliche (13–17)',
    erwachsene: 'Erwachsene (18–64)', senioren: 'Senioren (65+)',
  }
  const GENDER_LABELS: Record<string, string> = {
    maennlich: 'Männlich', weiblich: 'Weiblich', divers: 'Divers', alle: 'Alle',
  }
  const STADTBEREICH_LABELS: Record<string, string> = {
    innenstadt: 'Innenstadt', norden: 'Norden', sueden: 'Süden',
    osten: 'Osten', westen: 'Westen', gesamtstadt: 'Gesamtstadt',
  }

  const accordionDetails = [
    project.startYear ? { label: 'Startjahr', value: String(project.startYear) } : null,
    (project.stadtbereich ?? []).length > 0
      ? { label: 'Stadtbereich', value: (project.stadtbereich ?? []).map((v) => STADTBEREICH_LABELS[v] ?? v).join(', ') }
      : null,
    (project.altersgruppe ?? []).length > 0
      ? { label: 'Altersgruppe', value: (project.altersgruppe ?? []).map((v) => ALTERSGRUPPE_LABELS[v] ?? v).join(', ') }
      : null,
    (project.gender ?? []).length > 0
      ? { label: 'Zielgruppe', value: (project.gender ?? []).map((v) => GENDER_LABELS[v] ?? v).join(', ') }
      : null,
    project.isPublic != null
      ? { label: 'Öffentlich', value: project.isPublic ? 'Ja' : 'Nein' }
      : null,
    project.joinRequestsEnabled != null
      ? { label: 'Anfragen', value: project.joinRequestsEnabled ? 'Anfragen möglich' : 'Anfragen deaktiviert' }
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
                Phase {phase.step + 1}/7 · {phase.label}
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
                Verwalten
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
            {themaList.map((t) => (
              <span
                key={t}
                className="text-small px-2.5 py-0.5 rounded-full"
                style={{ background: P.white, border: `1px solid color-mix(in srgb, ${P.mid} 20%, transparent)`, color: P.dark, opacity: 0.8 }}
              >
                {THEMA_LABELS[t] ?? t}
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
          <span className="text-small font-medium" style={{ color: 'color-mix(in srgb, var(--project-accent) 60%, transparent)' }}>Projektinformationen</span>
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
