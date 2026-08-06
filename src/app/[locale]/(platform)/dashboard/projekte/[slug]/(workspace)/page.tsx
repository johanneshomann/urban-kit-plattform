import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { ModuleSection } from '@/components/platform/ModuleSection'
import { RecentActivityCard } from '@/components/platform/RecentActivityCard'
import { JoinProjectButton } from '@/components/platform/JoinProjectButton'
import { MODULE_ORDER, PARTICIPATE_MODULES, COLLABORATE_MODULES } from '@/lib/options/modules'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import { loadWorkspaceCards } from '@/lib/workspace-cards'
import { loadProjectActivity } from '@/lib/project-activity'
import { getWorkspaceContext } from '@/lib/workspace-context'

const P = {
  white: 'var(--project-white)',
  light: 'var(--project-light)',
  mid:   'var(--project-mid)',
  dark:  'var(--project-dark)',
  accent: 'var(--project-accent)',
} as const

// ─── page ─────────────────────────────────────────────────────────────────────
// Project overview inside the sidebar shell ([slug]/layout.tsx): slim top strip
// (phase + title + join), recent activity and the module content previews.
// Full project info lives on ./info.

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

  // Shared with the shell layout via React.cache — one fetch per request
  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()
  const { project, modules, isActiveMember } = ctx

  const payload = await getPayload({ config })
  const [cardData, activity] = await Promise.all([
    loadWorkspaceCards(payload, project.id, modules),
    loadProjectActivity(payload, project.id, modules),
  ])

  // Canonical module order; the personalized drag-order was retired with the
  // (keyboard-inaccessible) card drag-and-drop.
  const ordered = MODULE_ORDER.filter((m) => modules.includes(m))
  const participateItems = ordered.filter((m) => (PARTICIPATE_MODULES as readonly string[]).includes(m))
  const collaborateItems = ordered.filter((m) => (COLLABORATE_MODULES as readonly string[]).includes(m))

  const phase = PROJEKTPHASEN.find((p) => p.value === project.projektphase)
  const phaseLabel = phase ? tw('phaseLabel', { step: phase.step + 1, label: tax(`phase.${phase.value}`) }) : null

  const themaList = (project.thema ?? []).filter(Boolean)

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6" style={{ background: P.light }}>

      {/* top strip — replaces the old full-height hero */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          {phaseLabel && (
            <span
              className="self-start text-small font-medium px-3 py-1 rounded-full"
              style={{
                color: P.accent,
                background: `color-mix(in srgb, ${P.accent} 12%, transparent)`,
                border: `1.5px solid color-mix(in srgb, ${P.accent} 30%, transparent)`,
              }}
            >
              {phaseLabel}
            </span>
          )}
          <h1 className="text-title font-bold leading-tight" style={{ color: P.dark }}>{project.title}</h1>
        </div>
        {ctx.canRequestJoin && (
          <JoinProjectButton
            slug={slug}
            locale={locale}
            status={ctx.membershipStatus === 'requested' || ctx.membershipStatus === 'rejected' ? ctx.membershipStatus : null}
          />
        )}
      </div>

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

      <RecentActivityCard items={activity} locale={locale} moreHref={`/${locale}/dashboard/projekte/${slug}/m/news`} />

      {/* Mitmachen — always present (news + calendar guaranteed) */}
      <ModuleSection
        title={tw('sectionParticipate')}
        items={participateItems}
        projectSlug={slug}
        locale={locale}
        {...cardData}
      />

      {/* Zusammen arbeiten — only for active members, only if non-empty */}
      {isActiveMember && collaborateItems.length > 0 && (
        <ModuleSection
          title={tw('sectionCollaborate')}
          items={collaborateItems}
          projectSlug={slug}
          locale={locale}
          {...cardData}
        />
      )}

    </div>
  )
}
