// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { canViewContent } from '@/lib/visibility'
import { SAVEABLE_MODULE_COLLECTIONS } from '@/lib/workspace-search'

/**
 * Toggle a Merkliste bookmark on one piece of project content. Open to every
 * logged-in user who may SEE the doc (visibility model applies) — the save
 * itself grants no access: the Merkliste page re-checks visibility on read.
 */
export async function toggleSavedItem(
  slug: string,
  input: { module: string; itemId: string },
): Promise<{ ok: true; saved: boolean } | { error: string }> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const collection = SAVEABLE_MODULE_COLLECTIONS[input.module]
  if (!collection || typeof input.itemId !== 'string' || input.itemId.length > 64) return { error: 'Ungültiger Eintrag.' }

  const ctx = await getWorkspaceContext(slug)
  if (!ctx) return { error: 'Projekt nicht gefunden.' }

  try {
    const payload = await getPayload({ config })
    const doc = (await payload
      .findByID({ collection: collection as never, id: input.itemId, depth: 0, overrideAccess: true })
      .catch(() => null)) as Record<string, unknown> | null
    if (!doc) return { error: 'Eintrag nicht gefunden.' }
    const projectId = doc.project == null ? null : typeof doc.project === 'object' ? String((doc.project as { id: unknown }).id) : String(doc.project)
    if (projectId !== String(ctx.project.id)) return { error: 'Eintrag nicht gefunden.' }

    const membership = ctx.membershipId
      ? { id: ctx.membershipId, status: ctx.membershipStatus, role: ctx.role, teams: ctx.teams, leadOf: ctx.viewer.leadOf }
      : null
    if (!canViewContent(membership, doc as { visibility?: string | null; visibilityTeams?: string[] | null })) {
      return { error: 'Eintrag nicht gefunden.' }
    }

    const existing = await payload.find({
      collection: 'saved-items',
      where: {
        and: [
          { user: { equals: user.id } },
          { module: { equals: input.module } },
          { item: { equals: input.itemId } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      await payload.delete({ collection: 'saved-items', id: existing.docs[0].id, overrideAccess: true })
      return { ok: true, saved: false }
    }

    const title = String(doc.title ?? doc.label ?? doc.filename ?? doc.name ?? '') || 'Eintrag'
    const detailSlug = typeof doc.slug === 'string' ? doc.slug : null
    const href = (input.module === 'news' || input.module === 'forum') && detailSlug
      ? `/m/${input.module}/${detailSlug}`
      : `/m/${input.module}`
    await payload.create({
      collection: 'saved-items',
      data: { user: user.id, project: ctx.project.id, module: input.module, item: input.itemId, title, href },
      overrideAccess: true,
    })
    return { ok: true, saved: true }
  } catch {
    return { error: 'Merken fehlgeschlagen.' }
  }
}
