// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound, redirect } from 'next/navigation'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { SavedItemsList, type SavedListItem } from '@/components/platform/SavedItemsList'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { getUser } from '@/lib/auth/getUser'
import { canViewContent } from '@/lib/visibility'
import { SAVEABLE_MODULE_COLLECTIONS } from '@/lib/workspace-search'

/**
 * Personal Merkliste for this project. Rows are display snapshots — each
 * underlying doc is re-checked (exists, still visible to the viewer) so a
 * later visibility change can never leak a title through an old bookmark.
 */
export default async function MerklistePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()
  const user = await getUser()
  if (!user) redirect(`/${locale}/login`)

  const payload = await getPayload({ config })
  const saved = await payload.find({
    collection: 'saved-items',
    where: { and: [{ user: { equals: user.id } }, { project: { equals: ctx.project.id } }] },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const membership = ctx.membershipId
    ? { id: ctx.membershipId, status: ctx.membershipStatus, role: ctx.role, teams: ctx.teams, leadOf: ctx.viewer.leadOf }
    : null

  const items: SavedListItem[] = []
  for (const row of saved.docs as { module?: string; item?: string; title?: string; href?: string; createdAt?: string }[]) {
    const collection = row.module ? SAVEABLE_MODULE_COLLECTIONS[row.module] : undefined
    if (!collection || !row.item) continue
    const doc = (await payload
      .findByID({ collection: collection as never, id: row.item, depth: 0, overrideAccess: true })
      .catch(() => null)) as Record<string, unknown> | null
    if (!doc) continue
    if (!canViewContent(membership, doc as { visibility?: string | null; visibilityTeams?: string[] | null })) continue
    items.push({
      module: row.module!,
      itemId: row.item,
      // Prefer the live title over the snapshot
      title: String(doc.title ?? doc.label ?? doc.filename ?? doc.name ?? row.title ?? '') || 'Eintrag',
      href: row.href ?? `/m/${row.module}`,
      savedAt: row.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--project-light)' }}>
      <ProjectBreadcrumb items={[{ label: ctx.project.title, href: `/${locale}/dashboard/projekte/${slug}` }, { label: 'Merkliste' }]} />
      <h1 className="sr-only">Merkliste</h1>
      <main className="card-in flex-1 mt-5 p-6 md:p-10 w-full min-w-0" style={{ background: 'var(--project-white)' }}>
        <SavedItemsList slug={slug} base={`/${locale}/dashboard/projekte/${slug}`} items={items} />
      </main>
    </div>
  )
}
