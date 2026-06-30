import { getPayload } from 'payload'
import config from '@payload-config'
import { getUser } from '@/lib/auth/getUser'
import { getViewerTier } from '@/lib/visibility'
import type { Payload } from 'payload'
import type { User } from '@/payload-types'

export interface ManagedProject {
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
 * Resolve a team context (tier 'team' = PM or member flagged isTeam), or null.
 * Used by team-only modules (Tasks). Returns the payload instance too.
 */
export async function getProjectTeamContext(slug: string): Promise<ProjectTeamContext | null> {
  const user = await getUser()
  if (!user) return null

  const payload = await getPayload({ config })
  const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const project = projectRes.docs[0] as ManagedProject | undefined
  if (!project) return null

  const tier = await getViewerTier(payload, String(user.id), project.id)
  if (tier !== 'team') return null

  return { user, project, payload }
}
