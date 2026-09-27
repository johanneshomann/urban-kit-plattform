// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Payload } from 'payload'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { cascadeDeleteProject } from '@/lib/project-delete'
export type SettingsActionState = { error?: string; ok?: boolean }
export async function updateProjectVisibility(
  slug: string,
  locale: string,
  input: { isPublic: boolean; joinRequestsEnabled: boolean; chatGroupAssignmentEnabled?: boolean },
): Promise<SettingsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  try {
    const payload = await getPayload({ config })
    const data: Record<string, unknown> = {
      isPublic: !!input.isPublic,
      joinRequestsEnabled: !!input.joinRequestsEnabled,
      ...(input.chatGroupAssignmentEnabled !== undefined
        ? { chatGroupAssignmentEnabled: !!input.chatGroupAssignmentEnabled }
        : {}),
    }
    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Einstellungen konnten nicht gespeichert werden.' }
  }
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/einstellungen`)
  return { ok: true }
}
/**
 * Permanently delete a project and all of its project-scoped content. Requires
 * the PM to retype the project title. Cascades across modules (incl. nested
 * children like poll options/votes, forum comments, chat messages, task
 * assignees), then removes the project itself and redirects to the dashboard.
 */
export async function deleteProject(slug: string, locale: string, confirmTitle: string): Promise<SettingsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  if (confirmTitle.trim() !== ctx.project.title.trim()) {
    return { error: 'Der eingegebene Projektname stimmt nicht überein.' }
  }
  const id = ctx.project.id
  try {
    const payload = await getPayload({ config })
    await cascadeDeleteProject(payload, id)
  } catch {
    return { error: 'Projekt konnte nicht gelöscht werden.' }
  }
  revalidatePath(`/${locale}/dashboard`)
  redirect(`/${locale}/dashboard`)
}

/** Every project-scoped collection carrying a `visibilityTeams` array. */
const TEAM_TAGGED_COLLECTIONS = ['news-posts', 'calendar-events', 'polls', 'forum-threads', 'tasks', 'file-uploads', 'folders'] as const

/**
 * Rewrite every reference to renamed/removed team tags: membership `teams` +
 * `leadOf` and each content collection's `visibilityTeams`. Renames map tags,
 * removals drop them — so the catalog can never orphan references again.
 */
async function cascadeTeamChanges(payload: Payload, projectId: string, renames: Map<string, string>, removed: string[]): Promise<void> {
  const affected = [...renames.keys(), ...removed]
  if (affected.length === 0) return
  const mapTags = (tags: unknown): string[] => [
    ...new Set(
      (Array.isArray(tags) ? (tags as string[]) : [])
        .map((t) => renames.get(t) ?? t)
        .filter((t) => !removed.includes(t)),
    ),
  ]

  const mems = await payload.find({ collection: 'project-memberships', where: { project: { equals: projectId } }, limit: 1000, depth: 0, overrideAccess: true })
  for (const m of mems.docs) {
    const doc = m as { id: string | number; teams?: string[] | null; leadOf?: string[] | null }
    const teams = mapTags(doc.teams)
    const leadOf = mapTags(doc.leadOf)
    if (JSON.stringify(teams) !== JSON.stringify(doc.teams ?? []) || JSON.stringify(leadOf) !== JSON.stringify(doc.leadOf ?? [])) {
      await payload.update({ collection: 'project-memberships', id: doc.id, data: { teams, leadOf }, overrideAccess: true })
    }
  }

  for (const collection of TEAM_TAGGED_COLLECTIONS) {
    const res = await payload
      .find({ collection, where: { and: [{ project: { equals: projectId } }, { visibilityTeams: { in: affected } }] }, limit: 1000, depth: 0, overrideAccess: true })
      .catch(() => null)
    if (!res) continue
    for (const d of res.docs) {
      const doc = d as { id: string | number; visibilityTeams?: string[] | null }
      await payload.update({ collection, id: doc.id, data: { visibilityTeams: mapTags(doc.visibilityTeams) }, overrideAccess: true })
    }
  }
}

/**
 * Update the project team catalog (vocabulary for tagging members and scoping
 * content). Validates: array of unique, non-empty strings. `renames` maps old
 * tag names to their new name; renamed and removed tags cascade to memberships
 * (`teams`, `leadOf`) and every content `visibilityTeams` array.
 */
export async function updateProjectTeams(
  slug: string,
  locale: string,
  teams: string[],
  renames?: { from: string; to: string }[],
): Promise<SettingsActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const sanitized = (Array.isArray(teams) ? teams : [])
    .map((t) => String(t).trim())
    .filter((t) => t.length > 0)

  if (new Set(sanitized).size !== sanitized.length) {
    return { error: 'Team-Namen dürfen nicht doppelt vorkommen.' }
  }

  const oldCatalog = Array.isArray(ctx.project.teams) ? ctx.project.teams : []
  // Only accept renames from a real old tag to a tag present in the new catalog.
  const renameMap = new Map<string, string>()
  for (const r of Array.isArray(renames) ? renames : []) {
    const from = String(r.from).trim()
    const to = String(r.to).trim()
    if (from && to && from !== to && oldCatalog.includes(from) && sanitized.includes(to)) renameMap.set(from, to)
  }
  const removed = oldCatalog.filter((t) => !sanitized.includes(t) && !renameMap.has(t))

  try {
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'projects',
      id: ctx.project.id,
      data: { teams: sanitized },
      overrideAccess: true,
    })
    await cascadeTeamChanges(payload, ctx.project.id, renameMap, removed)
  } catch {
    return { error: 'Team-Katalog konnte nicht gespeichert werden.' }
  }

  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/allgemein`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/teams`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/mitglieder`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/team`)
  return { ok: true }
}
