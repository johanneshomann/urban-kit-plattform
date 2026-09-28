// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'
import { emitNotification } from '@/lib/events'
import { isDemoSession } from '@/lib/auth/demo'
import { actionError } from '@/lib/action-errors'

export type JoinActionState = { error?: string; ok?: boolean }

interface MembershipRow {
  id: string | number
  status?: string
  user?: string | number | { id: string | number }
}

function revalidateJoin(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/anfragen`)
  // Request state also surfaces on the dashboard (Alle Projekte) and the profile.
  revalidatePath('/[locale]/dashboard', 'page')
  revalidatePath('/[locale]/dashboard/profil', 'page')
}

/** Notify all active PMs of the project that a join request arrived. */
async function notifyProjectManagers(projectId: string) {
  const payload = await getPayload({ config })
  const pms = await payload.find({
    collection: 'project-memberships',
    where: {
      and: [
        { project: { equals: projectId } },
        { role: { equals: 'PM' } },
        { status: { equals: 'active' } },
      ],
    },
    depth: 0,
    limit: 50,
    overrideAccess: true,
  })
  for (const pm of pms.docs) {
    const u = (pm as unknown as MembershipRow).user
    const userId = u == null ? null : typeof u === 'object' ? String(u.id) : String(u)
    if (userId) {
      await emitNotification({
        type: 'join_request',
        userId,
        reference: { collectionSlug: 'projects', id: projectId },
      })
    }
  }
}

/**
 * Logged-in user asks to join a project. Creates a `requested` membership
 * (role Citizen) and notifies the PMs. A previously rejected request can be
 * re-submitted; an existing active membership or open request is an error.
 */
export async function requestToJoinProject(slug: string, locale: string): Promise<JoinActionState> {
  if (await isDemoSession()) return actionError('demoReadOnly')
  const user = await getUser()
  if (!user) return actionError('loginToJoin')

  try {
    const payload = await getPayload({ config })

    const projectRes = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const project = projectRes.docs[0] as { id: string; joinRequestsEnabled?: boolean | null } | undefined
    if (!project) return actionError('projectNotFound')
    if (project.joinRequestsEnabled === false) return actionError('requestsClosed')

    const existingRes = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { project: { equals: project.id } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const existing = existingRes.docs[0] as MembershipRow | undefined

    if (existing?.status === 'active') return actionError('alreadyMember')
    if (existing?.status === 'requested') return actionError('requestAlreadySent')

    if (existing) {
      // previously rejected or star-only ('none') — allow requesting
      const data: Record<string, unknown> = { status: 'requested', role: 'Citizen' }
      await payload.update({ collection: 'project-memberships', id: existing.id, data, overrideAccess: true })
    } else {
      await payload.create({
        collection: 'project-memberships',
        data: {
          user: user.id,
          project: project.id,
          role: 'Citizen',
          status: 'requested',
        },
        overrideAccess: true,
      })
    }

    await notifyProjectManagers(String(project.id))
  } catch {
    return actionError('requestSendFailed')
  }

  revalidateJoin(locale, slug)
  return { ok: true }
}

/** Withdraw one's own open join request. */
export async function cancelJoinRequest(slug: string, locale: string): Promise<JoinActionState> {
  if (await isDemoSession()) return actionError('demoReadOnly')
  const user = await getUser()
  if (!user) return actionError('notLoggedIn')

  try {
    const payload = await getPayload({ config })

    const projectRes = await payload.find({
      collection: 'projects',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const project = projectRes.docs[0] as { id: string } | undefined
    if (!project) return actionError('projectNotFound')

    const existingRes = await payload.find({
      collection: 'project-memberships',
      where: {
        and: [
          { user: { equals: user.id } },
          { project: { equals: project.id } },
          { status: { equals: 'requested' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const existing = existingRes.docs[0] as (MembershipRow & { starred?: boolean }) | undefined
    if (!existing) return actionError('noOpenRequest')

    if (existing.starred) {
      // The user also starred the project — keep the star, drop the request.
      await payload.update({ collection: 'project-memberships', id: existing.id, data: { status: 'none' }, overrideAccess: true })
    } else {
      await payload.delete({ collection: 'project-memberships', id: existing.id, overrideAccess: true })
    }
  } catch {
    return actionError('requestWithdrawFailed')
  }

  revalidateJoin(locale, slug)
  return { ok: true }
}
