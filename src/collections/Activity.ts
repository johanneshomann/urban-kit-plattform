import type { CollectionConfig } from 'payload'
import { isAdmin, scopedRead } from '@/lib/access'

export const Activity: CollectionConfig = {
  slug: 'activity',
  labels: {
    singular: { en: 'Activity', de: 'Aktivität' },
    plural: { en: 'Activities', de: 'Aktivitäten' },
  },
  access: {
    read: scopedRead({ projectPath: 'project' }),
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
        // NOTE: must not be named `id` — Payload reserves that name and
        // silently drops the value on save.
        { name: 'docId', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
