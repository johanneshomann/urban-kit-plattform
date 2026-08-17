// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { emitNotification } from '@/lib/events'

export type MembersActionState = { error?: string; ok?: boolean }

const ROLES = new Set(['PM', 'Citizen'])

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

/** Generate a unique, redeemable invitation code for a new membership (PM only). */
function makeInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) code += chars[Math.floor(Math.random() * chars.length)]
    if (i < 3) code += '-'
  }
  return code
}

export async function generateInvite(
  slug: string,
  locale: string,
): Promise<{ error?: string; ok?: boolean; code?: string }> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    // Create a placeholder membership (user resolved on redeem) with invited status.
    const doc = await payload.create({
      collection: 'project-memberships',
      data: {
        project: ctx.project.id,
        role: 'Citizen',
        status: 'invited',
        inviteCode: makeInviteCode(),
        // user is required — we bind it to the PM as a placeholder; redeem
        // reassigns it to the redeeming user.
        user: ctx.user.id,
      },
      overrideAccess: true,
    })
    const code = (doc as { inviteCode?: string }).inviteCode
    return { ok: true, code }
  } catch {
    return { error: 'Einladung konnte nicht erstellt werden.' }
  }
}

export async function setMemberTeams(
  slug: string,
  locale: string,
  membershipId: string,
  teams: string[],
  leadOf?: string[],
): Promise<MembersActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    const membership = await getProjectMembership(payload, ctx.project.id, membershipId)
    if (!membership) return { error: 'Mitglied nicht gefunden.' }

    const teamList = Array.isArray(teams) ? teams : []
    const data: Record<string, unknown> = { teams: teamList }
    if (Array.isArray(leadOf)) {
      // Leading implies belonging — leadOf must stay a subset of teams.
      data.leadOf = leadOf.filter((t) => teamList.includes(t))
    }
    await payload.update({ collection: 'project-memberships', id: membershipId, data, overrideAccess: true })
  } catch {
    return { error: 'Team-Status konnte nicht geändert werden.' }
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
          reference: { collectionSlug: 'projects', id: ctx.project.id },
        })
      }
    }
  } catch {
    return { error: 'Anfrage konnte nicht bearbeitet werden.' }
  }

  revalidateMembers(locale, slug)
  return { ok: true }
}
