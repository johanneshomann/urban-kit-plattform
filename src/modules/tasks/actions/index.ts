'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import { emitActivity, emitNotification } from '@/lib/events'
import type { User } from '@/payload-types'

export async function createTask(user: User, data: {
  title: string
  columnId: string
  projectId: string

  deadline?: string
  assigneeIds?: string[]
}) {
  const payload = await getPayload({ config })
  const task = await payload.create({
    collection: 'tasks',
    data: {
      title: data.title,
      column: data.columnId,
      author: user.id,
      deadline: data.deadline,
      project: data.projectId,
    },
    ...payloadAs(user),
  })
  // Create assignee records and notify
  if (data.assigneeIds?.length) {
    for (const assigneeId of data.assigneeIds) {
      await payload.create({
        collection: 'task-assignees',
        data: { task: task.id, user: assigneeId },
        overrideAccess: true,
      })
      if (assigneeId !== String(user.id)) {
        await emitNotification({ type: 'task_assigned', userId: assigneeId, reference: { collection: 'tasks', id: String(task.id) } })
      }
    }
  }
  await emitActivity({ type: 'tasks.created', userId: String(user.id), projectId: data.projectId, reference: { collection: 'tasks', id: String(task.id) } })
  return task
}

export async function updateTaskStatus(user: User, taskId: string, status: 'todo' | 'in_progress' | 'done', projectId: string) {
  const payload = await getPayload({ config })
  const task = await payload.update({
    collection: 'tasks',
    id: taskId,
    data: { status },
    ...payloadAs(user),
  })
  await emitActivity({ type: status === 'done' ? 'tasks.completed' : 'tasks.status_changed', userId: String(user.id), projectId, reference: { collection: 'tasks', id: taskId } })
  return task
}

export async function moveTask(user: User, taskId: string, columnId: string, order: number) {
  const payload = await getPayload({ config })
  return payload.update({
    collection: 'tasks',
    id: taskId,
    data: { column: columnId, order },
    ...payloadAs(user),
  })
}
