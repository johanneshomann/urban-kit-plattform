import type React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { ManageSidebar } from '@/components/platform/manage/ManageSidebar'
import { MODULE_ORDER, AUTHORABLE_MODULES } from '@/lib/options/modules'

/**
 * Manage area — PM-only. Guards the whole subtree and renders the project-themed
 * two-group sidebar (Inhalte = enabled modules, Projekt = config). The
 * `--project-*` vars come from the parent `[slug]/layout.tsx`.
 */
export default async function ManageLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) notFound()

  // Only modules whose content is authored in /manage appear under INHALTE.
  // Interactive modules (forum, tasks, board, chat) are managed in-project.
  const enabled = (ctx.project.modules ?? ['news', 'calendar'])
    .filter((m): m is string => typeof m === 'string' && AUTHORABLE_MODULES.has(m))
    .sort((a, b) => MODULE_ORDER.indexOf(a as never) - MODULE_ORDER.indexOf(b as never))

  // Open join requests — shown as a badge next to "Anfragen"
  const payload = await getPayload({ config })
  const requested = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ project: { equals: ctx.project.id } }, { status: { equals: 'requested' } }] },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--project-white)' }}>
      <ManageSidebar
        locale={locale}
        slug={slug}
        projectTitle={ctx.project.title}
        enabledModules={enabled}
        requestCount={requested.totalDocs}
      />
      <main className="flex-1 p-6 md:p-10 min-w-0">{children}</main>
    </div>
  )
}
