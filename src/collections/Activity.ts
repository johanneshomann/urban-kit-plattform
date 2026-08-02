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
    { name: 'type', type: 'text', required: true, label: { en: 'Type', de: 'Typ' } },
    { name: 'user', type: 'relationship', relationTo: 'users', label: { en: 'User', de: 'Benutzer:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
    {
      name: 'reference',
      type: 'group',
      fields: [
        { name: 'collectionSlug', type: 'text' },
        { name: 'id', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
