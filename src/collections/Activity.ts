import type { CollectionConfig } from 'payload'
import { isAdmin, isAuthenticated } from '@/lib/access'

export const Activity: CollectionConfig = {
  slug: 'activity',
  access: {
    read: isAuthenticated,
    create: () => false, // only via emitActivity helper
    update: () => false,
    delete: isAdmin,
  },
  admin: {
    defaultColumns: ['type', 'user', 'project', 'createdAt'],
  },
  fields: [
    { name: 'type', type: 'text', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
    {
      name: 'reference',
      type: 'group',
      fields: [
        { name: 'collection', type: 'text' },
        { name: 'id', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
