// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getViewerContext } from '@/lib/visibility'
import type { Payload } from 'payload'
import type { User } from '@/payload-types'

interface ManagedProject {
  id: string
  title: string
  slug: string
  modules?: string[] | null
  colorScheme?: string | null
}

export interface ProjectManagerContext {
  user: User
  project: ManagedProject
  membershipId: string
}

/**
 * Resolve the current user's PM context for a project, or null if they are not
 * an active Projektmanager of it. Shared by the manage layout (read guard) and
 * every manage server action (write guard). Returns null rather than throwing
 * so callers choose their own failure mode (notFound vs. thrown error).
 */
export async function getProjectManagerContext(slug: string): Promise<ProjectManagerContext | null> {
  const user = await getUser()
  if (!user) return null

  const payload = await getPayload({ config })

  const projectRes = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const project = projectRes.docs[0] as ManagedProject | undefined
  if (!project) return null

  const membershipRes = await payload.find({
    collection: 'project-memberships',
    where: {
      and: [
        { user: { equals: user.id } },
        { project: { equals: project.id } },
        { role: { equals: 'PM' } },
        { status: { equals: 'active' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const membership = membershipRes.docs[0]
  if (!membership) return null

  return { user, project, membershipId: String(membership.id) }
}

export interface ProjectTeamContext {
  user: User
  project: ManagedProject
  payload: Payload
}

/**
 * Resolve a team context (tier 'team' = PM or a member carrying any team tag
 * from the project catalog), or null. Used by team-only modules (Tasks).
 * Returns the payload instance too.
 */
/**
 * Content authoring context: PMs (full rights) or TEAM LEADS (leadOf tags on
 * their active membership). Leads author TEAM-visibility content clamped to
 * the teams they lead; callers must apply `clampTeams` before writing.
 */
export async function getContentAuthorContext(slug: string): Promise<
  { user: NonNullable<Awaited<ReturnType<typeof getUser>>>; project: ManagedProject; payload: Awaited<ReturnType<typeof getPayload>>; isPM: boolean; leadOf: string[] } | null
> {
  const user = await getUser()
  if (!user) return null
  const payload = await getPayload({ config })
  const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const project = projectRes.docs[0] as ManagedProject | undefined
  if (!project) return null
  const memRes = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: user.id } }, { project: { equals: project.id } }, { status: { equals: 'active' } }] },
    limit: 1, depth: 0, overrideAccess: true,
  })
  const mem = memRes.docs[0] as { role?: string; leadOf?: string[] | null } | undefined
  if (!mem) return null
  const isPM = mem.role === 'PM'
  const leadOf = Array.isArray(mem.leadOf) ? mem.leadOf : []
  if (!isPM && leadOf.length === 0) return null
  return { user, project, payload, isPM, leadOf }
}

/** Any ACTIVE member of the project (member or team tier) — e.g. moving own tasks. */
export async function getProjectMemberContext(slug: string): Promise<ProjectTeamContext | null> {
  const user = await getUser()
  if (!user) return null

  const payload = await getPayload({ config })
  const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const project = projectRes.docs[0] as ManagedProject | undefined
  if (!project) return null

  const ctx = await getViewerContext(payload, String(user.id), project.id)
  if (ctx.tier === 'public') return null

  return { user, project, payload }
}

export async function getProjectTeamContext(slug: string): Promise<ProjectTeamContext | null> {
  const user = await getUser()
  if (!user) return null

  const payload = await getPayload({ config })
  const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const project = projectRes.docs[0] as ManagedProject | undefined
  if (!project) return null

  const ctx = await getViewerContext(payload, String(user.id), project.id)
  if (ctx.tier !== 'team') return null

  return { user, project, payload }
}
