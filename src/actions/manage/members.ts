'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { emitNotification } from '@/lib/events'

export type MembersActionState = { error?: string; ok?: boolean }

const ROLES = new Set(['PM', 'Citizen', 'Follower'])

function revalidateMembers(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/mitglieder`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/anfragen`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
}

interface MembershipDoc {
  id: string | number
  role?: string
  status?: string
  user?: string | number | { id: string | number }
  project?: string | number | { id: string | number }
}

const refId = (v: MembershipDoc['user']): string | null =>
  v == null ? null : typeof v === 'object' ? String(v.id) : String(v)

/** Load a membership and verify it belongs to the managed project. */
async function getProjectMembership(payload: Payload, projectId: string, membershipId: string): Promise<MembershipDoc | null> {
  const doc = await payload
    .findByID({ collection: 'project-memberships', id: membershipId, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!doc) return null
  const m = doc as unknown as MembershipDoc
  return refId(m.project) === String(projectId) ? m : null
}

/** True if this membership is the only active PM of the project. */
async function isLastActivePM(payload: Payload, projectId: string, membership: MembershipDoc): Promise<boolean> {
  if (membership.role !== 'PM' || membership.status !== 'active') return false
  const pms = await payload.find({
    collection: 'project-memberships',
    where: {
      and: [
        { project: { equals: projectId } },
        { role: { equals: 'PM' } },
        { status: { equals: 'active' } },
      ],
    },
    limit: 2,
    depth: 0,
    overrideAccess: true,
  })
  return pms.totalDocs <= 1
}

export async function updateMemberRole(
  slug: string,
  locale: string,
  membershipId: string,
  role: string,
): Promise<MembersActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  if (!ROLES.has(role)) return { error: 'Unbekannte Rolle.' }

  try {
    const payload = await getPayload({ config })
    const membership = await getProjectMembership(payload, ctx.project.id, membershipId)
    if (!membership) return { error: 'Mitglied nicht gefunden.' }
    if (membership.role === role) return { ok: true }

    if (role !== 'PM' && (await isLastActivePM(payload, ctx.project.id, membership))) {
      return { error: 'Das Projekt braucht mindestens eine:n Projektmanager:in.' }
    }

    const data: Record<string, unknown> = { role }
    await payload.update({ collection: 'project-memberships', id: membershipId, data, overrideAccess: true })
  } catch {
    return { error: 'Rolle konnte nicht geändert werden.' }
  }

  revalidateMembers(locale, slug)
  return { ok: true }
}

export async function removeMember(
  slug: string,
  locale: string,
  membershipId: string,
): Promise<MembersActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    const membership = await getProjectMembership(payload, ctx.project.id, membershipId)
    if (!membership) return { error: 'Mitglied nicht gefunden.' }

    if (await isLastActivePM(payload, ctx.project.id, membership)) {
      return { error: 'Das Projekt braucht mindestens eine:n Projektmanager:in.' }
    }

    await payload.delete({ collection: 'project-memberships', id: membershipId, overrideAccess: true })
  } catch {
    return { error: 'Mitglied konnte nicht entfernt werden.' }
  }

  revalidateMembers(locale, slug)
  return { ok: true }
}

export async function respondToJoinRequest(
  slug: string,
  locale: string,
  membershipId: string,
  decision: 'approve' | 'reject',
): Promise<MembersActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    const membership = await getProjectMembership(payload, ctx.project.id, membershipId)
    if (!membership) return { error: 'Anfrage nicht gefunden.' }
    if (membership.status !== 'requested') return { error: 'Anfrage wurde bereits beantwortet.' }

    const data: Record<string, unknown> =
      decision === 'approve'
        ? { status: 'active', role: membership.role && ROLES.has(membership.role) ? membership.role : 'Citizen' }
        : { status: 'rejected' }
    await payload.update({ collection: 'project-memberships', id: membershipId, data, overrideAccess: true })

    if (decision === 'approve') {
      const userId = refId(membership.user)
      if (userId) {
        await emitNotification({
          type: 'invited',
          userId,
          reference: { collection: 'projects', id: ctx.project.id },
        })
      }
    }
  } catch {
    return { error: 'Anfrage konnte nicht bearbeitet werden.' }
  }

  revalidateMembers(locale, slug)
  return { ok: true }
}
