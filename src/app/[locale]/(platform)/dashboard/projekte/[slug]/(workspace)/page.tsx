// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

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
  const [cardData, activity] = await Promise.all([
    loadWorkspaceCards(payload, project.id, modules),
    loadProjectActivity(payload, project.id, modules),
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
    </div>
  )
}
