// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Server-side clamps for team-scoped writes. Every `visibilityTeams` array
 * that reaches the database must pass through here so free-string tags can
 * never leave the project's team catalog (and leads can never scope beyond
 * the teams they lead).
 */

export type ClampedVisibility = { visibility: 'PUBLIC' | 'PROJECT' | 'TEAM'; visibilityTeams: string[] }

/** `?team=` value meaning "content addressed to everyone" (non-TEAM docs). */
export const TEAM_FILTER_ALL = '~alle'

/**
 * Does a doc match the module pages' `?team=` filter?
 * No filter → everything; `~alle` → non-TEAM docs; a tag → TEAM docs
 * carrying that tag (legacy TEAM docs without tags match every tag).
 */
export function matchesTeamFilter(
  doc: { visibility?: string | null; visibilityTeams?: string[] | null },
  filter: string | null | undefined,
): boolean {
  if (!filter) return true
  const isTeam = doc.visibility === 'TEAM'
  if (filter === TEAM_FILTER_ALL) return !isTeam
  const tags = doc.visibilityTeams ?? []
  return isTeam && (tags.length === 0 || tags.includes(filter))
}

/** Keep only tags that exist in the project's team catalog. */
export function clampTeamsToCatalog(tags: string[] | null | undefined, catalog: string[] | null | undefined): string[] {
  const cat = Array.isArray(catalog) ? catalog : []
  return (Array.isArray(tags) ? tags : []).filter((t) => cat.includes(t))
}

/**
 * Clamp an author's visibility choice:
 * - PMs keep their choice; TEAM tags are intersected with the project catalog.
 * - Team leads are forced to TEAM with tags intersected against the teams they
 *   lead (empty → all led teams, so a lead can never write an unscoped doc).
 */
export function clampAuthorVisibility(
  ctx: { isPM: boolean; leadOf: string[] },
  visibility: string | undefined,
  visibilityTeams: string[] | undefined,
  catalog: string[] | null | undefined,
): ClampedVisibility {
  if (ctx.isPM) {
    const v = (visibility === 'PUBLIC' || visibility === 'TEAM' ? visibility : 'PROJECT') as 'PUBLIC' | 'PROJECT' | 'TEAM'
    return { visibility: v, visibilityTeams: v === 'TEAM' ? clampTeamsToCatalog(visibilityTeams, catalog) : [] }
  }
  const teams = (Array.isArray(visibilityTeams) ? visibilityTeams : []).filter((t) => ctx.leadOf.includes(t))
  return { visibility: 'TEAM', visibilityTeams: teams.length ? teams : ctx.leadOf }
}
