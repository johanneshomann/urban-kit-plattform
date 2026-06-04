import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Folders: CollectionConfig = {
  slug: 'folders',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'parent', type: 'relationship', relationTo: 'folders' },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'INTERNAL',
      options: [
        { label: 'Öffentlich', value: 'PUBLIC' },
        { label: 'Intern', value: 'INTERNAL' },
        { label: 'Team', value: 'TEAM' },
      ],
    },
  ],
  timestamps: true,
}
