// Project-level access control building blocks.
// All module collection access functions compose these.

import type { AccessArgs } from 'payload'

type ProjectAccessArgs = AccessArgs & { data?: { project?: string } }

export async function isProjectMember(
  payload: Awaited<ReturnType<typeof import('payload').getPayload>>,
  userId: string,
  projectId: string,
): Promise<{ isMember: boolean; role: string | null }> {
  const result = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: userId } }, { project: { equals: projectId } }] },
    limit: 1,
    overrideAccess: true,
  })

  if (result.totalDocs === 0) return { isMember: false, role: null }
  return { isMember: true, role: (result.docs[0] as unknown as { role: string }).role }
}

export async function isProjectManager(
  payload: Awaited<ReturnType<typeof import('payload').getPayload>>,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const { role } = await isProjectMember(payload, userId, projectId)
  return role === 'PM'
}
