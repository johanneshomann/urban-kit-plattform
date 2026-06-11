'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'
import { emitNotification } from '@/lib/events'

export type JoinActionState = { error?: string; ok?: boolean }

interface MembershipRow {
  id: string | number
  status?: string
  user?: string | number | { id: string | number }
}

function revalidateJoin(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/anfragen`)
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
        reference: { collection: 'projects', id: projectId },
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
  const user = await getUser()
  if (!user) return { error: 'Bitte melde dich an, um mitzumachen.' }

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
    if (!project) return { error: 'Projekt nicht gefunden.' }
    if (project.joinRequestsEnabled === false) return { error: 'Dieses Projekt nimmt derzeit keine Anfragen an.' }

    const existingRes = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { project: { equals: project.id } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const existing = existingRes.docs[0] as MembershipRow | undefined

    if (existing?.status === 'active') return { error: 'Du bist bereits Mitglied dieses Projekts.' }
    if (existing?.status === 'requested') return { error: 'Deine Anfrage ist bereits eingegangen.' }

    if (existing) {
      // previously rejected — allow re-requesting
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
    return { error: 'Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.' }
  }

  revalidateJoin(locale, slug)
  return { ok: true }
}

/** Withdraw one's own open join request. */
export async function cancelJoinRequest(slug: string, locale: string): Promise<JoinActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

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
    if (!project) return { error: 'Projekt nicht gefunden.' }

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
    const existing = existingRes.docs[0] as MembershipRow | undefined
    if (!existing) return { error: 'Keine offene Anfrage gefunden.' }

    await payload.delete({ collection: 'project-memberships', id: existing.id, overrideAccess: true })
  } catch {
    return { error: 'Anfrage konnte nicht zurückgezogen werden.' }
  }

  revalidateJoin(locale, slug)
  return { ok: true }
}
