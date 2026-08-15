// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { isAdmin, scopedRead } from '@/lib/access'

export const TaskAssignees: CollectionConfig = {
  slug: 'task-assignees',
  labels: {
    singular: { en: 'Task assignee', de: 'Aufgabenzuweisung' },
    plural: { en: 'Task assignees', de: 'Aufgabenzuweisungen' },
  },
  access: {
    read: scopedRead({ projectPath: 'task.project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'task', type: 'relationship', relationTo: 'tasks', required: true, label: { en: 'Task', de: 'Aufgabe' } },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: { en: 'User', de: 'Benutzer:in' } },
  ],
}
