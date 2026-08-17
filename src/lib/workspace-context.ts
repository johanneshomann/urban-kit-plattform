// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { ViewerContext } from '@/lib/visibility'

/** Project fields consumed by the workspace layout (hero) and page. */
type WorkspaceProject = {
  id: string
  title: string
  slug: string
  shortDescription?: string | null
  coverImage?: { url?: string } | null
  colorScheme?: string | null
  modules?: string[]
  projektphase?: string | null
  thema?: string[]
  gallery?: Array<{
    image?: { url?: string; alt?: string | null } | null
    caption?: string | null
    id?: string | null
  }> | null
  projektbeschreibung?: unknown
  beteiligungsvorhaben?: unknown
  startYear?: number | null
  altersgruppe?: string[] | null
  gender?: string[] | null
  stadtbereich?: string[] | null
  isPublic?: boolean | null
  joinRequestsEnabled?: boolean | null
  kontakt?: {
    email?: string | null
    telefon?: string | null
    website?: string | null
  } | null
  ansprechperson?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
}

export interface WorkspaceContext {
  project: WorkspaceProject
  modules: string[]
  membershipId: string | null
  role: string | null
  membershipStatus: string | null
  isLoggedIn: boolean
  canManage: boolean
  canRequestJoin: boolean
  isActiveMember: boolean
  /** Team tags on the viewer's active membership (from the project catalog). */
  teams: string[]
  /** Resolved viewer context (tier + teams) for visibility filtering. */
  viewer: ViewerContext
}

/**
 * Project + viewer-membership context for the project workspace subtree.
 * Wrapped in React.cache() so the (workspace) layout (hero) and the page share
 * a single fetch per request. Returns null when the project doesn't exist.
 */
export const getWorkspaceContext = cache(async (slug: string): Promise<WorkspaceContext | null> => {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  const project = result.docs[0] as unknown as WorkspaceProject | undefined
  if (!project) return null

  const modules: string[] = project.modules ?? ['news', 'calendar']

  // Viewer membership via the Payload auth cookie
  const token = (await cookies()).get('payload-token')?.value
  let membershipId: string | null = null
  let role: string | null = null
  let membershipStatus: string | null = null
  let teamTags: string[] = []
  let leadOf: string[] = []
  let isLoggedIn = false

  let viewerIsAdmin = false
  if (token) {
    const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
    if (me.user) {
      isLoggedIn = true
      viewerIsAdmin = (me.user as { role?: string }).role === 'admin'
      const membershipResult = await payload.find({
        collection: 'project-memberships',
        where: { and: [{ user: { equals: me.user.id } }, { project: { equals: project.id } }] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const membership = membershipResult.docs[0] as { id: string; role?: string; status?: string; teams?: string[] | null; leadOf?: string[] | null } | undefined
      if (membership) {
        membershipId = membership.id
        role = membership.role ?? null
        membershipStatus = membership.status ?? null
        leadOf = Array.isArray(membership.leadOf) ? membership.leadOf : []
        // Leading implies belonging — leads always see their team's content.
        teamTags = [...new Set([...(Array.isArray(membership.teams) ? membership.teams : []), ...leadOf])]
      }
    }
  }

  const isActiveMembership = membershipStatus === 'active'
  // Private projects are invisible to everyone but active members and admins —
  // same 404 as a non-existent slug, so the slug can't be probed.
  if (project.isPublic === false && !isActiveMembership && !viewerIsAdmin) return null

  const canManage = role === 'PM' && membershipStatus === 'active'
  // Offer "Mitmachen" to logged-in users without an active membership (open
  // requests show their pending state; rejected users may ask again).
  const canRequestJoin = isLoggedIn && membershipStatus !== 'active' && project.joinRequestsEnabled !== false
  const isActiveMember = membershipStatus === 'active'

  const viewer: ViewerContext = {
    tier: !isActiveMember ? 'public' : role === 'PM' || teamTags.length > 0 ? 'team' : 'member',
    teams: teamTags,
    leadOf,
    isPM: role === 'PM',
    active: isActiveMember,
  }

  return {
    project,
    modules,
    membershipId,
    role,
    membershipStatus,
    isLoggedIn,
    canManage,
    canRequestJoin,
    isActiveMember,
    teams: teamTags,
    viewer,
  }
})