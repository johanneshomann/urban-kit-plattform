// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'
import { relId } from '@/lib/chat/access'
import { isDemoSession } from '@/lib/auth/demo'
import { actionError } from '@/lib/action-errors'

export type LeaveProjectState = { ok?: true; error?: string }

/**
 * Leave a project: deletes the caller's own membership. PMs cannot leave —
 * they would orphan the project; they must hand over or be removed via manage.
 */
export async function leaveProject(membershipId: string): Promise<LeaveProjectState> {
  if (await isDemoSession()) return actionError('demoReadOnly')
  const user = await getUser()
  if (!user) return actionError('notLoggedIn')

  const payload = await getPayload({ config })
  const membership = await payload
    .findByID({ collection: 'project-memberships', id: membershipId, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!membership || relId(membership.user) !== String(user.id)) return actionError('membershipNotFound')
  if (membership.role === 'PM') return actionError('pmCannotLeave')

  try {
    if (membership.status === 'requested' && membership.starred) {
      // Withdrawing a request while the project is starred: keep the star.
      await payload.update({ collection: 'project-memberships', id: membershipId, data: { status: 'none' }, overrideAccess: true })
    } else {
      await payload.delete({ collection: 'project-memberships', id: membershipId, overrideAccess: true })
    }
  } catch {
    return actionError('leaveFailed')
  }

  revalidatePath('/[locale]/dashboard', 'page')
  revalidatePath('/[locale]/dashboard/profil', 'page')
  return { ok: true }
}
