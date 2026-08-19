// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { UrbanAgentOverviewCard } from '@/components/platform/modules/urban-agent/UrbanAgentOverviewCard'

import { ModuleSection } from '@/components/platform/ModuleSection'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { RecentActivityCard } from '@/components/platform/RecentActivityCard'
import { JoinProjectButton } from '@/components/platform/JoinProjectButton'
import { MODULE_ORDER, PARTICIPATE_MODULES, COLLABORATE_MODULES } from '@/lib/options/modules'
import { loadWorkspaceCards } from '@/lib/workspace-cards'
import { loadProjectActivity } from '@/lib/project-activity'
import { getWorkspaceContext } from '@/lib/workspace-context'

const P = { light: 'var(--project-light)' } as const

// ─── page ─────────────────────────────────────────────────────────────────────
// Project overview inside the sidebar shell ([slug]/layout.tsx): breadcrumb,
// join button (non-members), recent activity and the module content previews.
// Full project info lives on ./info.

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const tw = await getTranslations({ locale, namespace: 'projectWorkspace' })

  // Shared with the shell layout via React.cache — one fetch per request
  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()
  const { project, modules, isActiveMember } = ctx

  const payload = await getPayload({ config })
  // Membership doc shape for per-document TEAM checks inside the loaders.
  const membership = ctx.membershipId
    ? { id: ctx.membershipId, status: ctx.membershipStatus, role: ctx.role, teams: ctx.teams }
    : null
  const [cardData, activity] = await Promise.all([
    loadWorkspaceCards(payload, project.id, modules, ctx.viewer, membership),
    loadProjectActivity(payload, project.id, modules, ctx.viewer, membership),
  ])

  // Canonical module order; the personalized drag-order was retired with the
  // (keyboard-inaccessible) card drag-and-drop.
  const ordered = MODULE_ORDER.filter((m) => modules.includes(m))
  const participateItems = ordered.filter((m) => (PARTICIPATE_MODULES as readonly string[]).includes(m))
  const collaborateItems = ordered.filter((m) => (COLLABORATE_MODULES as readonly string[]).includes(m))

  return (
    <div className="flex-1 flex flex-col" style={{ background: P.light }}>
      {/* Same top pattern as the module pages: the breadcrumb names the page
          (here: the project itself), the h1 stays sr-only (BITV). */}
      <ProjectBreadcrumb items={[{ label: project.title }]} />
      <h1 className="sr-only">{project.title}</h1>
      {/* White content card under the light breadcrumb band — same pattern as manage */}
      <div className="card-in flex-1 mt-5 p-6 md:p-10 min-w-0 flex flex-col gap-6" style={{ background: 'var(--project-white)' }}>

      {/* join request — right-aligned, only for non-members */}
      {ctx.canRequestJoin && (
        <div className="flex justify-end">
          <JoinProjectButton
            slug={slug}
            locale={locale}
            status={ctx.membershipStatus === 'requested' || ctx.membershipStatus === 'rejected' ? ctx.membershipStatus : null}
          />
        </div>
      )}

      {/* Urban Agent — pointer card on top with inline question input and the
          chat's suggested prompts (module gating mirrors collaborate: members only) */}
      {isActiveMember && modules.includes('urban-agent') && (
        <UrbanAgentOverviewCard slug={slug} base={`/${locale}/dashboard/projekte/${slug}`} />
      )}

      <RecentActivityCard
        items={activity}
        locale={locale}
        base={`/${locale}/dashboard/projekte/${slug}`}
      />

      {/* All module cards in ONE plain grid (no Mitmachen/Zusammenarbeiten
          sections); collaborate cards only for active members. The urban-agent
          card is dropped here — it has its own pointer card on top. */}
      <ModuleSection
        items={[...participateItems, ...(isActiveMember ? collaborateItems.filter((m) => m !== 'urban-agent') : [])]}
        projectSlug={slug}
        locale={locale}
        {...cardData}
      />

      </div>
    </div>
  )
}
