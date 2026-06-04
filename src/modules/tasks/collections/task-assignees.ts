import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const TaskAssignees: CollectionConfig = {
  slug: 'task-assignees',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'task', type: 'relationship', relationTo: 'tasks', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
  ],
}
