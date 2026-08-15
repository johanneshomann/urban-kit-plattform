// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { isAdmin, scopedRead } from '@/lib/access'

export const TaskColumns: CollectionConfig = {
  slug: 'task-columns',
  labels: {
    singular: { en: 'Task column', de: 'Aufgabenspalte' },
    plural: { en: 'Task columns', de: 'Aufgabenspalten' },
  },
  access: {
    read: scopedRead({ projectPath: 'project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true, label: { en: 'Name', de: 'Name' } },
    { name: 'order', type: 'number', defaultValue: 0, label: { en: 'Order', de: 'Reihenfolge' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
}
