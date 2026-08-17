// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'

export type TeamLeadActionState = { error?: string; ok?: boolean }

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

/**
 * Guard for team-lead roster actions: the acting user must be an ACTIVE
 * member whose `leadOf` contains the team (validated against the project
 * catalog). PMs pass for every team — they own the catalog anyway.
 */
async function getLeadContext(slug: string, team: string) {
  const user = await getUser()
  if (!user) return null
  const payload = await getPayload({ config })
  const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const project = projectRes.docs[0] as { id: string | number; teams?: string[] | null } | undefined
  if (!project) return null
  const catalog = Array.isArray(project.teams) ? project.teams : []
  if (!catalog.includes(team)) return null

  const memRes = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: user.id } }, { project: { equals: project.id } }, { status: { equals: 'active' } }] },
    limit: 1, depth: 0, overrideAccess: true,
  })
  const mem = memRes.docs[0] as { role?: string; leadOf?: string[] | null } | undefined
  if (!mem) return null
  const isPM = mem.role === 'PM'
  const leads = Array.isArray(mem.leadOf) ? mem.leadOf : []
  if (!isPM && !leads.includes(team)) return null

  return { payload, projectId: String(project.id), isPM }
}

function revalidateTeam(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/team`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/mitglieder`)
}

/** Add an active member to the lead's team (tag on their membership). */
export async function addMemberToTeam(slug: string, locale: string, team: string, membershipId: string): Promise<TeamLeadActionState> {
  const ctx = await getLeadContext(slug, team)
  if (!ctx) return { error: 'Nur die Teamleitung kann Mitglieder aufnehmen.' }
  try {
    const mem = await ctx.payload.findByID({ collection: 'project-memberships', id: membershipId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!mem || relId((mem as { project?: unknown }).project) !== ctx.projectId || (mem as { status?: string }).status !== 'active') {
      return { error: 'Mitglied nicht gefunden.' }
    }
    const teams = new Set(Array.isArray((mem as { teams?: string[] }).teams) ? (mem as { teams?: string[] }).teams : [])
    teams.add(team)
    await ctx.payload.update({ collection: 'project-memberships', id: membershipId, data: { teams: [...teams] }, overrideAccess: true })
  } catch {
    return { error: 'Mitglied konnte nicht aufgenommen werden.' }
  }
  revalidateTeam(locale, slug)
  return { ok: true }
}

/**
 * Remove a member from the lead's team. Fellow LEADS of the team can only be
 * removed by a PM (leads must not demote each other).
 */
export async function removeMemberFromTeam(slug: string, locale: string, team: string, membershipId: string): Promise<TeamLeadActionState> {
  const ctx = await getLeadContext(slug, team)
  if (!ctx) return { error: 'Nur die Teamleitung kann Mitglieder entfernen.' }
  try {
    const mem = await ctx.payload.findByID({ collection: 'project-memberships', id: membershipId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!mem || relId((mem as { project?: unknown }).project) !== ctx.projectId) return { error: 'Mitglied nicht gefunden.' }
    const memLeads = Array.isArray((mem as { leadOf?: string[] }).leadOf) ? ((mem as { leadOf?: string[] }).leadOf as string[]) : []
    if (memLeads.includes(team) && !ctx.isPM) return { error: 'Teamleitungen entfernt nur die Projektleitung.' }
    const teams = (Array.isArray((mem as { teams?: string[] }).teams) ? ((mem as { teams?: string[] }).teams as string[]) : []).filter((t) => t !== team)
    const leadOf = memLeads.filter((t) => t !== team)
    await ctx.payload.update({ collection: 'project-memberships', id: membershipId, data: { teams, leadOf }, overrideAccess: true })
  } catch {
    return { error: 'Mitglied konnte nicht entfernt werden.' }
  }
  revalidateTeam(locale, slug)
  return { ok: true }
}
