// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { Payload, Where } from 'payload'

/**
 * Content visibility model. Content carries a `visibility` field plus an
 * optional set of team tags (`visibilityTeams`); a viewer's access is derived
 * from their active membership to the project (scalar tier + team tags).
 *
 *   PUBLIC  → everyone (incl. logged-out)
 *   PROJECT → all active members (formerly INTERNAL)
 *   TEAM    → active members whose `teams` intersect the doc's
 *             `visibilityTeams`; PMs see all TEAM content.
 *
 * Legacy values are tolerated on read: stored `INTERNAL` is treated as
 * `PROJECT`, and a `TEAM` doc without `visibilityTeams` falls back to "any
 * team-tagged member" so pre-migration data stays meaningful.
 *
 * Pure functions here are safe to import in client components; the async
 * `getViewerContext` takes a Payload instance so this module stays
 * dependency-free.
 */

export type Visibility = 'PUBLIC' | 'PROJECT' | 'TEAM'

/** What a viewer is relative to a project (coarse tier, for UI branches). */
export type ViewerTier = 'public' | 'member' | 'team'

export interface ViewerMembership {
  id: string | number
  status?: string | null
  role?: string | null
  teams?: string[] | null
}

/** Resolved viewer context — tier + team tags for scoping decisions. */
export interface ViewerContext {
  tier: ViewerTier
  teams: string[]
  isPM: boolean
  active: boolean
}

/** Map any stored value (incl. legacy INTERNAL/unknown) to the canonical enum. */
function normalizeVisibility(visibility: string | null | undefined): Visibility {
  if (visibility === 'PUBLIC') return 'PUBLIC'
  if (visibility === 'TEAM') return 'TEAM'
  // INTERNAL (legacy) and anything unknown → PROJECT (safe default)
  return 'PROJECT'
}

/** Coarse compatibility check: can `tier` see `visibility`? Legacy INTERNAL → PROJECT. */
export function canView(tier: ViewerTier, visibility: string | null | undefined): boolean {
  const v = normalizeVisibility(visibility)
  if (v === 'PUBLIC') return true
  if (tier === 'public') return false
  if (v === 'PROJECT') return true
  // TEAM is only decidable by membership tags, not the scalar tier — the
  // membership-aware `canViewContent` must be used for team scoping.
  return tier === 'team'
}

/**
 * Membership-aware content check (use for single documents).
 * PUBLIC always; PROJECT if active; TEAM if PM, team tags intersect, or (legacy)
 * any tagged member when the doc lists no teams.
 */
export function canViewContent(
  membership: ViewerMembership | null,
  doc: { visibility?: string | null; visibilityTeams?: string[] | null },
): boolean {
  const v = normalizeVisibility(doc.visibility)
  if (v === 'PUBLIC') return true
  if (!membership || membership.status !== 'active') return false
  if (v === 'PROJECT') return true
  // TEAM
  if (membership.role === 'PM') return true
  const memberTeams = membership.teams ?? []
  const docTeams = doc.visibilityTeams ?? []
  if (docTeams.length > 0) return docTeams.some((t) => memberTeams.includes(t))
  // Legacy fallback: TEAM without visibilityTeams → any team-tagged member
  return memberTeams.length > 0
}

/**
 * A Payload `where` clause matching content the viewer may see. Callers must
 * additionally scope by `project` (this clause only filters `visibility`).
 * Legacy INTERNAL docs are included wherever PROJECT is allowed.
 */
export function visibilityWhere(ctx: ViewerContext): Where {
  const allowed: Visibility[] = ctx.tier === 'public' ? ['PUBLIC'] : ['PUBLIC', 'PROJECT']
  const or: Where[] = [{ visibility: { in: [...allowed, 'INTERNAL'] } }]
  if (ctx.tier === 'team') {
    if (ctx.isPM) {
      or.push({ visibility: { equals: 'TEAM' } })
    } else if (ctx.teams.length > 0) {
      or.push({ visibility: { equals: 'TEAM' }, visibilityTeams: { in: ctx.teams } })
    }
  }
  return { or }
}

/**
 * Resolve a user's viewer context for a project via their (active) membership.
 * Pass `userId: null` for logged-out visitors (→ public, no teams).
 */
export async function getViewerContext(payload: Payload, userId: string | null, projectId: string): Promise<ViewerContext> {
  if (!userId) return { tier: 'public', teams: [], isPM: false, active: false }
  const res = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: userId } }, { project: { equals: projectId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const m = res.docs[0] as (ViewerMembership & { status?: string }) | undefined
  if (!m || m.status !== 'active') return { tier: 'public', teams: [], isPM: false, active: false }
  const isPM = m.role === 'PM'
  const teams = Array.isArray(m.teams) ? m.teams : []
  const tier: ViewerTier = isPM || teams.length > 0 ? 'team' : 'member'
  return { tier, teams, isPM, active: true }
}

/**
 * Resolve a user's scalar tier for a project. Thin wrapper over
 * `getViewerContext` for callers that only need the coarse tier.
 */
export async function getViewerTier(payload: Payload, userId: string | null, projectId: string): Promise<ViewerTier> {
  return (await getViewerContext(payload, userId, projectId)).tier
}