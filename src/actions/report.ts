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
import { emitNotifications } from '@/lib/events'
import { isDemoSession } from '@/lib/auth/demo'
import { actionError } from '@/lib/action-errors'

/**
 * Report one piece of project content to the project's PMs (notification with
 * the doc as reference). Logged-in users only, and only for docs the reporter
 * may actually see — a report can never be a visibility probe.
 */
export async function reportContent(
  slug: string,
  input: { module: string; itemId: string },
): Promise<{ ok: true } | { error: string }> {
  if (await isDemoSession()) return actionError('demoReadOnly')
  const user = await getUser()
  if (!user) return actionError('notLoggedIn')

  const collection = SAVEABLE_MODULE_COLLECTIONS[input.module]
  if (!collection || typeof input.itemId !== 'string' || input.itemId.length > 64) return actionError('invalidItem')

  const ctx = await getWorkspaceContext(slug)
  if (!ctx) return actionError('projectNotFound')

  try {
    const payload = await getPayload({ config })
    const doc = (await payload
      .findByID({ collection: collection as never, id: input.itemId, depth: 0, overrideAccess: true })
      .catch(() => null)) as Record<string, unknown> | null
    if (!doc) return actionError('itemNotFound')
    const projectId = doc.project == null ? null : typeof doc.project === 'object' ? String((doc.project as { id: unknown }).id) : String(doc.project)
    if (projectId !== String(ctx.project.id)) return actionError('itemNotFound')
    const membership = ctx.membershipId
      ? { id: ctx.membershipId, status: ctx.membershipStatus, role: ctx.role, teams: ctx.teams, leadOf: ctx.viewer.leadOf }
      : null
    if (!canViewContent(membership, doc as { visibility?: string | null; visibilityTeams?: string[] | null })) {
      return actionError('itemNotFound')
    }

    const pms = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ project: { equals: ctx.project.id } }, { role: { equals: 'PM' } }, { status: { equals: 'active' } }] },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })
    const pmIds = pms.docs
      .map((m) => {
        const u = (m as { user?: unknown }).user
        return u == null ? null : String(typeof u === 'object' ? (u as { id: unknown }).id : u)
      })
      .filter((id): id is string => !!id && id !== String(user.id))
    await emitNotifications(pmIds.map((userId) => ({
      type: 'content_reported' as const,
      userId,
      reference: { collectionSlug: collection, id: input.itemId },
    })))
    return { ok: true }
  } catch {
    return actionError('reportFailed')
  }
}
