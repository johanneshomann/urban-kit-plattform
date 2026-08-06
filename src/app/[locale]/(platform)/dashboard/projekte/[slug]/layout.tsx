import type React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveColorScheme, schemeToCssVars } from '@/lib/colorScheme'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { projectDefaults } from '@/lib/defaults/project'
import { MODULE_ORDER, PARTICIPATE_MODULES, COLLABORATE_MODULES, MANAGE_MODULES } from '@/lib/options/modules'
import { ProjectThemeScope } from '@/components/platform/ProjectThemeScope'
import { ProjectSidebar } from '@/components/platform/ProjectSidebar'
import { ProjectTabBar } from '@/components/platform/ProjectTabBar'

/**
 * Shell for the whole `[slug]` subtree — workspace AND manage area. Scopes the
 * project's colour scheme (`--project-*` vars) and renders the persistent
 * project navigation: `ProjectSidebar` (≥ lg) and `ProjectTabBar` (< lg).
 *
 * The tier-filtered module lists passed to the nav are presentation only:
 * `manage/layout.tsx` keeps its `getProjectManagerContext` guard and every
 * module page keeps its own module-enabled + visibility checks.
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  // Shared with the pages below via React.cache — one fetch per request
  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()

  const scheme = resolveColorScheme(ctx.project.colorScheme ?? null)
  const cssVars = schemeToCssVars(scheme)

  const enabled = MODULE_ORDER.filter((m) => ctx.modules.includes(m))
  const participate = enabled.filter((m) => (PARTICIPATE_MODULES as readonly string[]).includes(m))
  const collaborate = ctx.isActiveMember
    ? enabled.filter((m) => (COLLABORATE_MODULES as readonly string[]).includes(m))
    : []
  const manageModules = ctx.canManage ? enabled.filter((m) => MANAGE_MODULES.has(m)) : []

  // Open join requests — badge next to "Anfragen" (PM-only, one count query)
  let requestCount = 0
  if (ctx.canManage) {
    const payload = await getPayload({ config })
    const requested = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ project: { equals: ctx.project.id } }, { status: { equals: 'requested' } }] },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    })
    requestCount = requested.totalDocs
  }

  return (
    <div data-project-theme style={cssVars as React.CSSProperties}>
      {/* Lift the scheme onto <html> so the platform header can adopt it */}
      <ProjectThemeScope scheme={scheme} />
      <div className="flex min-h-svh">
        {/* Sidebar fades in independently (card-in) while the content area
            slides in from the right via DashboardTransition. */}
        <div className="card-in">
          <ProjectSidebar
            locale={locale}
            slug={slug}
            projectTitle={ctx.project.title}
            coverSrc={ctx.project.coverImage?.url ?? projectDefaults.coverImage}
            participate={participate}
            collaborate={collaborate}
            manageModules={manageModules}
            canManage={ctx.canManage}
            requestCount={requestCount}
          />
        </div>
        {/* pb-16 keeps the fixed mobile tab bar from covering content */}
        <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">{children}</div>
      </div>
      <ProjectTabBar
        locale={locale}
        slug={slug}
        participate={participate}
        collaborate={collaborate}
        manageModules={manageModules}
        canManage={ctx.canManage}
        requestCount={requestCount}
      />
    </div>
  )
}
