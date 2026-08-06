'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { emitNotification } from '@/lib/events'

export type InviteActionState = { error?: string; ok?: boolean }

/**
 * Redeem an invitation code. Requires a logged-in user. Finds the `invited`
 * membership carrying the code, checks the project still accepts joins
 * (`joinRequestsEnabled !== false`), then activates it (status → active,
 * role → Citizen) and reassigns it to the redeeming user.
 */
export async function redeemInvite(code: string, locale: string): Promise<InviteActionState> {
  const user = await getUser()
  if (!user) return { error: 'Bitte melde dich an, um einen Einladungscode einzulösen.' }

  const normalized = code.trim().toUpperCase()
  if (!normalized) return { error: 'Bitte einen Einladungscode eingeben.' }

  try {
    const payload = await getPayload({ config })

    const res = await payload.find({
      collection: 'project-memberships',
      where: { inviteCode: { equals: normalized } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    const membership = res.docs[0] as
      | { id: string; status?: string; project: { id: string; slug?: string; joinRequestsEnabled?: boolean | null } }
      | undefined
    if (!membership || membership.status !== 'invited') return { error: 'Ungültiger oder bereits verwendeter Einladungscode.' }

    const project = membership.project
    if (!project || project.joinRequestsEnabled === false) {
      return { error: 'Dieses Projekt nimmt derzeit keine Einladungen an.' }
    }

    await payload.update({
      collection: 'project-memberships',
      id: membership.id,
      data: { user: user.id, status: 'active', role: 'Citizen', inviteCode: null },
      overrideAccess: true,
    })

    // Notify the project's PMs that a new member joined via invite.
    const pms = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ project: { equals: project.id } }, { role: { equals: 'PM' } }, { status: { equals: 'active' } }] },
      depth: 0, limit: 50, overrideAccess: true,
    })
    for (const pm of pms.docs) {
      const u = (pm as { user?: unknown }).user
      const userId = u == null ? null : typeof u === 'object' ? String((u as { id: unknown }).id) : String(u)
      if (userId) {
        await emitNotification({
          type: 'join_request',
          userId,
          reference: { collectionSlug: 'projects', id: String(project.id) },
        })
      }
    }

    revalidatePath(`/${locale}/dashboard/projekte/${project.slug ?? ''}`)
    return { ok: true }
  } catch {
    return { error: 'Einladung konnte nicht eingelöst werden.' }
  }
}

/** Withdraw a pending invitation (PM only). */
export async function revokeInvite(slug: string, locale: string, inviteCode: string): Promise<InviteActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Keine Berechtigung.' }

  const payload = await getPayload({ config })
  const membership = await payload.find({
    collection: 'project-memberships',
    where: {
      and: [
        { inviteCode: { equals: inviteCode } },
        { project: { equals: ctx.project.id } },
        { status: { equals: 'invited' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  }).catch(() => ({ docs: [] }))
  const target = membership.docs[0] as { id: string } | undefined
  if (!target) return { error: 'Einladung nicht gefunden.' }

  await payload.delete({ collection: 'project-memberships', id: target.id, overrideAccess: true })
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/mitglieder`)
  return { ok: true }
}