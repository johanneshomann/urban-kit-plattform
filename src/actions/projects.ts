// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'

/**
 * Toggle the starred flag on a project membership. Creates a star-only
 * membership (role: Citizen, status: 'none') if the user doesn't have one
 * yet — 'none' keeps stars out of the PM's join-request inbox. Un-starring a
 * star-only row deletes it. Public-callable — requires a logged-in user.
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
    const m = existing.docs[0] as { id: string; starred?: boolean; status?: string }
    if (currentStarred && m.status === 'none') {
      // Un-starring a star-only row: nothing else keeps it alive — remove it.
      await payload.delete({ collection: 'project-memberships', id: m.id, overrideAccess: true })
    } else {
      await payload.update({
        collection: 'project-memberships',
        id: m.id,
        data: { starred: !currentStarred },
        overrideAccess: true,
      })
    }
  } else if (!currentStarred) {
    // Create a star-only membership (citizen role, status 'none')
    await payload.create({
      collection: 'project-memberships',
      data: {
        user: userId,
        project: projectId,
        role: 'Citizen',
        status: 'none',
        starred: true,
      },
      overrideAccess: true,
    })
  }

  return { ok: true }
}
