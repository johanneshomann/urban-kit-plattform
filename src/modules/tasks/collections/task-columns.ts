import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const TaskColumns: CollectionConfig = {
  slug: 'task-columns',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
    {
      name: 'projectModule',
      type: 'group',
      fields: [
        { name: 'project', type: 'relationship', relationTo: 'projects' },
        { name: 'module', type: 'relationship', relationTo: 'project-modules' },
      ],
    },
  ],
}
