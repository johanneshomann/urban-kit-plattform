import type { Payload, Where } from 'payload'

/**
 * Content visibility model (3-tier). Content carries a `visibility` field;
 * a viewer has a `tier` derived from their relationship to the project.
 *
 *   PUBLIC   → everyone (incl. logged-out)
 *   INTERNAL → active members + team
 *   TEAM     → team only (PMs + members flagged isTeam)
 *
 * Pure functions here are safe to import in client components; the async
 * `getViewerTier` takes a Payload instance so this module stays dependency-free.
 */

export type Visibility = 'PUBLIC' | 'INTERNAL' | 'TEAM'

/** What a viewer is relative to a project. */
export type ViewerTier = 'public' | 'member' | 'team'

const TIER_ALLOWS: Record<ViewerTier, Visibility[]> = {
  public: ['PUBLIC'],
  member: ['PUBLIC', 'INTERNAL'],
  team: ['PUBLIC', 'INTERNAL', 'TEAM'],
}

/** Derive a viewer's tier from their (active) membership, if any. */
export function viewerTier(membership: { status?: string | null; role?: string | null; isTeam?: boolean | null } | null): ViewerTier {
  if (!membership || membership.status !== 'active') return 'public'
  if (membership.role === 'PM' || membership.isTeam === true) return 'team'
  return 'member'
}

/** Can a viewer of `tier` see content of `visibility`? Unknown visibility is treated as INTERNAL. */
export function canView(tier: ViewerTier, visibility: Visibility | string | null | undefined): boolean {
  const v: Visibility = visibility === 'PUBLIC' || visibility === 'TEAM' ? visibility : 'INTERNAL'
  return TIER_ALLOWS[tier].includes(v)
}

/** A Payload `where` clause restricting the `visibility` field to what `tier` may see. */
export function visibilityWhere(tier: ViewerTier): Where {
  return { visibility: { in: TIER_ALLOWS[tier] } }
}

/**
 * Resolve a user's tier for a project via their membership.
 * Pass `userId: null` for logged-out visitors (→ 'public').
 */
export async function getViewerTier(payload: Payload, userId: string | null, projectId: string): Promise<ViewerTier> {
  if (!userId) return 'public'
  const res = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: userId } }, { project: { equals: projectId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const m = res.docs[0] as { status?: string; role?: string; isTeam?: boolean } | undefined
  return viewerTier(m ?? null)
}
