'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

export async function saveModuleOrderAction(membershipId: string, order: string[]): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return

  const payload = await getPayload({ config })
  const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
  if (!me.user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.update({
    collection: 'project-memberships',
    id: membershipId,
    data: { moduleOrder: order } as any,
    overrideAccess: true,
  })
}

/**
 * Toggle the starred flag on a project membership. Creates a non-active
 * "star-only" membership (role: Citizen, status: requested) if the user
 * doesn't have one yet. Public-callable — requires a logged-in user.
 */
export async function toggleProjectStar(
  projectId: string,
  currentStarred: boolean,
): Promise<{ ok?: boolean; error?: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return { error: 'Bitte melde dich an.' }

  const payload = await getPayload({ config })
  const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) })
  if (!me.user) return { error: 'Bitte melde dich an.' }

  const userId = String(me.user.id)

  // Find existing membership (any status)
  const existing = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: userId } }, { project: { equals: projectId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    const m = existing.docs[0] as { id: string; starred?: boolean }
    await payload.update({
      collection: 'project-memberships',
      id: m.id,
      data: { starred: !currentStarred },
      overrideAccess: true,
    })
  } else if (!currentStarred) {
    // Create a star-only membership (non-active, citizen role)
    await payload.create({
      collection: 'project-memberships',
      data: {
        user: userId,
        project: projectId,
        role: 'Citizen',
        status: 'requested',
        starred: true,
      },
      overrideAccess: true,
    })
  }

  return { ok: true }
}
