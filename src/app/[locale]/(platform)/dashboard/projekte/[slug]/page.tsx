import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { House, Settings2 } from 'lucide-react'

import { cookies } from 'next/headers'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { projectDefaults } from '@/lib/defaults/project'
import { resolveColorScheme } from '@/lib/colorScheme'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import { JoinProjectButton } from '@/components/platform/JoinProjectButton'
import { ModuleSection } from '@/components/platform/ModuleSection'
import { ProjectInfoAccordion } from '@/components/platform/ProjectInfoAccordion'
import { PARTICIPATE_MODULES, COLLABORATE_MODULES } from '@/lib/options/modules'
import { loadWorkspaceCards } from '@/lib/workspace-cards'
import { loadProjectActivity } from '@/lib/project-activity'
import { RecentActivityCard } from '@/components/platform/RecentActivityCard'

// ─── types ────────────────────────────────────────────────────────────────────

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

  // Content previews for the module cards (both sections) + hero activity feed
  const [cardData, activity] = await Promise.all([
    loadWorkspaceCards(payload, project.id, modules),
    loadProjectActivity(payload, project.id, modules),
  ])

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

  // Partition into the two workspace sections, preserving the user's saved order.
  // Chat is excluded from both (it becomes a floating pop-up, not a card).
  const isActiveMember = membershipStatus === 'active'
  const participateItems = moduleOrder.filter((id) => (PARTICIPATE_MODULES as readonly string[]).includes(id))
  const collaborateItems = moduleOrder.filter((id) => (COLLABORATE_MODULES as readonly string[]).includes(id))

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

      {/* ── Split hero: text left, cover + activity right ─────────────────── */}
      <div className="grid lg:grid-cols-2" style={{ background: P.white }}>
        {/* Left — text */}
        <div className="px-6 md:px-10 pt-6 pb-8 flex flex-col">
          <Link href={`/${locale}/dashboard`} className="transition-opacity opacity-40 hover:opacity-90 mb-6" style={{ color: P.dark }}>
            <House className="w-[1em] h-[1em]" />
          </Link>

          {phase && (
            <span
              className="self-start text-small font-medium mb-4"
              style={{
                color: P.accent,
                background: 'color-mix(in srgb, var(--project-accent) 12%, transparent)',
                border: '1.5px solid color-mix(in srgb, var(--project-accent) 30%, transparent)',
                padding: '0.3em 0.75em', borderRadius: '999px',
              }}
            >
              {tw('phaseLabel', { step: phase.step + 1, label: tax(`phase.${phase.value}`) })}
            </span>
          )}

          <h1 className="text-title font-bold leading-tight" style={{ color: P.dark }}>{project.title}</h1>
          <p className="text-small mt-3 max-w-md" style={{ color: P.dark, opacity: 0.6 }}>
            {project.shortDescription || tw('heroTagline')}
          </p>

          {(canManage || canRequestJoin) && (
            <div className="flex items-center gap-2 mt-5">
              {canManage && (
                <Link
                  href={`/${locale}/dashboard/projekte/${slug}/manage`}
                  className="flex items-center gap-1.5 text-small font-medium transition-colors hover:bg-[var(--project-accent)] hover:text-[var(--project-dark)] hover:border-[var(--project-accent)]"
                  style={{
                    color: P.accent,
                    background: 'color-mix(in srgb, var(--project-accent) 12%, transparent)',
                    border: '1.5px solid color-mix(in srgb, var(--project-accent) 30%, transparent)',
                    padding: '0.3em 0.75em', borderRadius: '999px',
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
          )}
        </div>

        {/* Right — cover image with floating activity card */}
        <div className="relative min-h-[16rem] lg:min-h-0">
          <img src={coverSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to right, ${scheme.white}cc 0%, ${scheme.white}00 30%)` }}
          />
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <RecentActivityCard items={activity} locale={locale} moreHref={`/${locale}/dashboard/projekte/${slug}/m/news`} />
          </div>
        </div>
      </div>

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

        {/* Mitmachen — always present (news + calendar guaranteed) */}
        <ModuleSection
          title={tw('sectionParticipate')}
          items={participateItems}
          fullOrder={moduleOrder}
          membershipId={membershipId}
          projectSlug={slug}
          locale={locale}
          {...cardData}
        />

        {/* Zusammen arbeiten — only for active members, only if non-empty */}
        {isActiveMember && collaborateItems.length > 0 && (
          <ModuleSection
            title={tw('sectionCollaborate')}
            items={collaborateItems}
            fullOrder={moduleOrder}
            membershipId={membershipId}
            projectSlug={slug}
            locale={locale}
            {...cardData}
          />
        )}

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
