'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import type { Task } from '@/payload-types'
import { getProjectManagerContext, getProjectTeamContext } from '@/lib/auth/requireProjectManager'
import { markdownToLexical } from '@/lib/richtext'
import { emitNotification } from '@/lib/events'

export type TasksActionState = { error?: string; ok?: boolean }

const STATUSES = new Set(['todo', 'in_progress', 'done'])
const PRIORITIES = new Set(['low', 'medium', 'high'])
const status = (v: unknown) => (STATUSES.has(v as string) ? (v as 'todo' | 'in_progress' | 'done') : 'todo')
const priority = (v: unknown) => (PRIORITIES.has(v as string) ? (v as 'low' | 'medium' | 'high') : 'medium')
const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

export interface TaskInput {
  title: string
  description?: string
  status?: string
  priority?: string
  deadline?: string | null
  labels?: string[]
  assigneeIds?: string[]
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
async function syncAssignees(payload: Payload, projectId: string, taskId: string, userIds: string[]) {
  await payload.delete({ collection: 'task-assignees', where: { task: { equals: taskId } }, overrideAccess: true })
  const unique = [...new Set(userIds.filter(Boolean))]
  for (const uid of unique) {
    const mem = await payload.find({ collection: 'project-memberships', where: { and: [{ user: { equals: uid } }, { project: { equals: projectId } }, { status: { equals: 'active' } }] }, limit: 1, depth: 0, overrideAccess: true })
    if (mem.totalDocs > 0) await payload.create({ collection: 'task-assignees', data: { task: taskId, user: uid }, overrideAccess: true })
  }
}

export async function createTask(slug: string, locale: string, input: TaskInput): Promise<TasksActionState> {
  const pm = await getProjectManagerContext(slug)
  if (!pm) return { error: 'Nur Projektmanager:innen können Aufgaben erstellen.' }
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
        visibility: 'TEAM', author: pm.user.id, project: pm.project.id,
      },
      overrideAccess: true,
    })
    if (input.assigneeIds?.length) {
      await syncAssignees(payload, pm.project.id, String(task.id), input.assigneeIds)
      for (const uid of input.assigneeIds) await emitNotification({ type: 'task_assigned', userId: uid, reference: { collection: 'tasks', id: String(task.id) } })
    }
  } catch {
    return { error: 'Aufgabe konnte nicht erstellt werden.' }
  }
  revalidateTasks(locale, slug)
  return { ok: true }
}

export async function updateTask(slug: string, locale: string, taskId: string, input: TaskInput): Promise<TasksActionState> {
  const pm = await getProjectManagerContext(slug)
  if (!pm) return { error: 'Nur Projektmanager:innen können Aufgaben bearbeiten.' }
  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  try {
    const payload = await getPayload({ config })
    if (!(await getProjectTask(payload, pm.project.id, taskId))) return { error: 'Aufgabe nicht gefunden.' }
    const description = typeof input.description === 'string'
      ? (input.description.trim() ? ((await markdownToLexical(input.description)) as Task['description']) : null)
      : undefined
    await payload.update({
      collection: 'tasks', id: taskId,
      data: { title, description, status: status(input.status), priority: priority(input.priority), deadline: input.deadline || null, labels: (input.labels ?? []).map((l) => l.trim()).filter(Boolean) },
      overrideAccess: true,
    })
    if (input.assigneeIds) await syncAssignees(payload, pm.project.id, taskId, input.assigneeIds)
  } catch {
    return { error: 'Aufgabe konnte nicht gespeichert werden.' }
  }
  revalidateTasks(locale, slug)
  return { ok: true }
}

export async function deleteTask(slug: string, locale: string, taskId: string): Promise<TasksActionState> {
  const pm = await getProjectManagerContext(slug)
  if (!pm) return { error: 'Nur Projektmanager:innen können Aufgaben löschen.' }
  try {
    const payload = await getPayload({ config })
    if (!(await getProjectTask(payload, pm.project.id, taskId))) return { error: 'Aufgabe nicht gefunden.' }
    await payload.delete({ collection: 'task-assignees', where: { task: { equals: taskId } }, overrideAccess: true })
    await payload.delete({ collection: 'tasks', id: taskId, overrideAccess: true })
  } catch {
    return { error: 'Aufgabe konnte nicht gelöscht werden.' }
  }
  revalidateTasks(locale, slug)
  return { ok: true }
}

/** Move a task to a new status column — PMs move any task, assignees move their own. */
export async function moveTask(slug: string, locale: string, taskId: string, newStatus: string): Promise<TasksActionState> {
  const team = await getProjectTeamContext(slug)
  if (!team) return { error: 'Nur das Projektteam hat Zugriff.' }
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
