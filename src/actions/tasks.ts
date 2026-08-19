// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import type { Task } from '@/payload-types'
import { getProjectManagerContext, getProjectTeamContext, getProjectMemberContext } from '@/lib/auth/requireProjectManager'
import { clampTeamsToCatalog } from '@/lib/team-scope'
import { canViewContent, getViewerState } from '@/lib/visibility'
import { markdownToLexical } from '@/lib/richtext'
import { emitNotification } from '@/lib/events'

export type TasksActionState = { error?: string; ok?: boolean }

const STATUSES = new Set(['todo', 'in_progress', 'done'])
const PRIORITIES = new Set(['low', 'medium', 'high'])
const status = (v: unknown) => (STATUSES.has(v as string) ? (v as 'todo' | 'in_progress' | 'done') : 'todo')
const priority = (v: unknown) => (PRIORITIES.has(v as string) ? (v as 'low' | 'medium' | 'high') : 'medium')
const visibility = (v: unknown) => (v === 'PROJECT' ? 'PROJECT' : 'TEAM') as 'PROJECT' | 'TEAM'
const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

export interface TaskInput {
  title: string
  description?: string
  status?: string
  priority?: string
  deadline?: string | null
  labels?: string[]
  assigneeIds?: string[]
  /** 'PROJECT' = alle Mitglieder, 'TEAM' = nur Projektteam (PM-only choice). */
  visibility?: string
  /** Specific team tags a TEAM task addresses (empty → whole Projektteam). */
  visibilityTeams?: string[]
}

/**
 * Who may author tasks: PMs (any task, any visibility) and team-tier members
 * (their own tasks, always TEAM visibility — the UI hides the choice for them).
 */
async function taskActorCtx(slug: string) {
  const pm = await getProjectManagerContext(slug)
  if (pm) return { user: pm.user, project: pm.project, isPM: true, actorTeams: [] as string[] }
  const team = await getProjectTeamContext(slug)
  if (!team) return null
  // Team-tier member: their team tags (∪ leadOf) bound the tags a task may target.
  const mem = await team.payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: team.user.id } }, { project: { equals: team.project.id } }, { status: { equals: 'active' } }] },
    limit: 1, depth: 0, overrideAccess: true,
  })
  const m = mem.docs[0] as { teams?: string[] | null; leadOf?: string[] | null } | undefined
  const actorTeams = [...new Set([...(Array.isArray(m?.teams) ? m.teams : []), ...(Array.isArray(m?.leadOf) ? m.leadOf : [])])]
  return { user: team.user, project: team.project, isPM: false, actorTeams }
}

/** Clamp a task's team tags: PMs against the catalog, members against their own teams. */
function taskTeams(ctx: { isPM: boolean; actorTeams: string[]; project: { teams?: string[] | null } }, input: TaskInput): string[] {
  const wantsTeam = ctx.isPM ? input.visibility !== 'PROJECT' : true
  if (!wantsTeam) return []
  return ctx.isPM
    ? clampTeamsToCatalog(input.visibilityTeams, ctx.project.teams)
    : clampTeamsToCatalog(input.visibilityTeams, ctx.actorTeams)
}

function revalidateTasks(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/m/tasks`)
}

async function getProjectTask(payload: Payload, projectId: string, taskId: string) {
  const t = await payload.findByID({ collection: 'tasks', id: taskId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!t || relId((t as { project?: unknown }).project) !== String(projectId)) return null
  return t
}

/** Replace a task's assignees with the given user ids (validated as active members). */
/** Replace a task's assignees; returns the ids that are NEWLY assigned. */
async function syncAssignees(payload: Payload, projectId: string, taskId: string, userIds: string[]): Promise<string[]> {
  const previous = await payload.find({ collection: 'task-assignees', where: { task: { equals: taskId } }, limit: 100, depth: 0, overrideAccess: true })
  const previousIds = new Set(
    previous.docs
      .map((a) => {
        const u = (a as { user?: unknown }).user
        return u == null ? null : String(typeof u === 'object' ? (u as { id: unknown }).id : u)
      })
      .filter((id): id is string => !!id),
  )
  await payload.delete({ collection: 'task-assignees', where: { task: { equals: taskId } }, overrideAccess: true })
  const unique = [...new Set(userIds.filter(Boolean))]
  const added: string[] = []
  for (const uid of unique) {
    const mem = await payload.find({ collection: 'project-memberships', where: { and: [{ user: { equals: uid } }, { project: { equals: projectId } }, { status: { equals: 'active' } }] }, limit: 1, depth: 0, overrideAccess: true })
    if (mem.totalDocs > 0) {
      await payload.create({ collection: 'task-assignees', data: { task: taskId, user: uid }, overrideAccess: true })
      if (!previousIds.has(uid)) added.push(uid)
    }
  }
  return added
}

export async function createTask(slug: string, locale: string, input: TaskInput): Promise<TasksActionState> {
  const ctx = await taskActorCtx(slug)
  if (!ctx) return { error: 'Nur das Projektteam kann Aufgaben erstellen.' }
  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  try {
    const payload = await getPayload({ config })
    const description = input.description?.trim() ? ((await markdownToLexical(input.description)) as Task['description']) : undefined
    const task = await payload.create({
      collection: 'tasks',
      data: {
        title, description, status: status(input.status), priority: priority(input.priority),
        deadline: input.deadline || null,
        labels: (input.labels ?? []).map((l) => l.trim()).filter(Boolean),
        // Only PMs publish tasks to all members; team members stay TEAM.
        visibility: ctx.isPM ? visibility(input.visibility) : 'TEAM',
        visibilityTeams: taskTeams(ctx, input),
        author: ctx.user.id, project: ctx.project.id,
      },
      overrideAccess: true,
    })
    if (input.assigneeIds?.length) {
      const added = await syncAssignees(payload, ctx.project.id, String(task.id), input.assigneeIds)
      for (const uid of added) await emitNotification({ type: 'task_assigned', userId: uid, reference: { collectionSlug: 'tasks', id: String(task.id) } })
    }
  } catch {
    return { error: 'Aufgabe konnte nicht erstellt werden.' }
  }
  revalidateTasks(locale, slug)
  return { ok: true }
}

export async function updateTask(slug: string, locale: string, taskId: string, input: TaskInput): Promise<TasksActionState> {
  const ctx = await taskActorCtx(slug)
  if (!ctx) return { error: 'Nur das Projektteam kann Aufgaben bearbeiten.' }
  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  try {
    const payload = await getPayload({ config })
    const task = await getProjectTask(payload, ctx.project.id, taskId)
    if (!task) return { error: 'Aufgabe nicht gefunden.' }
    // Non-PM team members only edit their own tasks.
    if (!ctx.isPM && relId((task as { author?: unknown }).author) !== String(ctx.user.id)) {
      return { error: 'Nur eigene Aufgaben können bearbeitet werden.' }
    }
    const description = typeof input.description === 'string'
      ? (input.description.trim() ? ((await markdownToLexical(input.description)) as Task['description']) : null)
      : undefined
    await payload.update({
      collection: 'tasks', id: taskId,
      data: {
        title, description, status: status(input.status), priority: priority(input.priority), deadline: input.deadline || null, labels: (input.labels ?? []).map((l) => l.trim()).filter(Boolean),
        // Visibility is PM-curated; team members can't republish their tasks
        // (their tag choice is still clamped to their own teams).
        ...(ctx.isPM ? { visibility: visibility(input.visibility) } : {}),
        visibilityTeams: taskTeams(ctx, input),
      },
      overrideAccess: true,
    })
    if (input.assigneeIds) {
      // Newly added assignees on an EDIT get notified too (not just on create).
      const added = await syncAssignees(payload, ctx.project.id, taskId, input.assigneeIds)
      for (const uid of added) await emitNotification({ type: 'task_assigned', userId: uid, reference: { collectionSlug: 'tasks', id: taskId } })
    }
  } catch {
    return { error: 'Aufgabe konnte nicht gespeichert werden.' }
  }
  revalidateTasks(locale, slug)
  return { ok: true }
}

export async function deleteTask(slug: string, locale: string, taskId: string): Promise<TasksActionState> {
  const ctx = await taskActorCtx(slug)
  if (!ctx) return { error: 'Nur das Projektteam kann Aufgaben löschen.' }
  try {
    const payload = await getPayload({ config })
    const task = await getProjectTask(payload, ctx.project.id, taskId)
    if (!task) return { error: 'Aufgabe nicht gefunden.' }
    if (!ctx.isPM && relId((task as { author?: unknown }).author) !== String(ctx.user.id)) {
      return { error: 'Nur eigene Aufgaben können gelöscht werden.' }
    }
    await payload.delete({ collection: 'task-assignees', where: { task: { equals: taskId } }, overrideAccess: true })
    await payload.delete({ collection: 'tasks', id: taskId, overrideAccess: true })
  } catch {
    return { error: 'Aufgabe konnte nicht gelöscht werden.' }
  }
  revalidateTasks(locale, slug)
  return { ok: true }
}

/**
 * Toggle self-assignment: any active member may take (or drop) a task they
 * can SEE — the visibility check keeps TEAM tasks inside their audience.
 */
export async function toggleSelfAssignTask(slug: string, locale: string, taskId: string): Promise<TasksActionState> {
  const member = await getProjectMemberContext(slug)
  if (!member) return { error: 'Nur Projektmitglieder haben Zugriff.' }
  try {
    const task = await getProjectTask(member.payload, member.project.id, taskId)
    if (!task) return { error: 'Aufgabe nicht gefunden.' }
    const { membership } = await getViewerState(member.payload, String(member.user.id), member.project.id)
    if (!canViewContent(membership, task as { visibility?: string | null; visibilityTeams?: string[] | null })) {
      return { error: 'Aufgabe nicht gefunden.' }
    }
    const existing = await member.payload.find({
      collection: 'task-assignees',
      where: { and: [{ task: { equals: taskId } }, { user: { equals: member.user.id } }] },
      limit: 1, depth: 0, overrideAccess: true,
    })
    if (existing.docs[0]) {
      await member.payload.delete({ collection: 'task-assignees', id: existing.docs[0].id, overrideAccess: true })
    } else {
      await member.payload.create({ collection: 'task-assignees', data: { task: taskId, user: member.user.id }, overrideAccess: true })
    }
  } catch {
    return { error: 'Zuweisung konnte nicht geändert werden.' }
  }
  revalidateTasks(locale, slug)
  return { ok: true }
}

/** Move a task to a new status column — PMs move any task, assignees move their own (any active member can be assigned). */
export async function moveTask(slug: string, locale: string, taskId: string, newStatus: string): Promise<TasksActionState> {
  const team = await getProjectMemberContext(slug)
  if (!team) return { error: 'Nur Projektmitglieder haben Zugriff.' }
  try {
    const task = await getProjectTask(team.payload, team.project.id, taskId)
    if (!task) return { error: 'Aufgabe nicht gefunden.' }

    const mem = await team.payload.find({ collection: 'project-memberships', where: { and: [{ user: { equals: team.user.id } }, { project: { equals: team.project.id } }, { status: { equals: 'active' } }] }, limit: 1, depth: 0, overrideAccess: true })
    const isPM = (mem.docs[0] as { role?: string } | undefined)?.role === 'PM'
    if (!isPM) {
      const assigned = await team.payload.find({ collection: 'task-assignees', where: { and: [{ task: { equals: taskId } }, { user: { equals: team.user.id } }] }, limit: 1, depth: 0, overrideAccess: true })
      if (assigned.totalDocs === 0) return { error: 'Nur zugewiesene Personen oder PMs können diese Aufgabe verschieben.' }
    }

    await team.payload.update({ collection: 'tasks', id: taskId, data: { status: status(newStatus) }, overrideAccess: true })
  } catch {
    return { error: 'Aufgabe konnte nicht verschoben werden.' }
  }
  revalidateTasks(locale, slug)
  return { ok: true }
}
