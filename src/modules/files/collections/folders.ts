import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Folders: CollectionConfig = {
  slug: 'folders',
  labels: {
    singular: { en: 'Folder', de: 'Ordner' },
    plural: { en: 'Folders', de: 'Ordner' },
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true, label: { en: 'Name', de: 'Name' } },
    { name: 'parent', type: 'relationship', relationTo: 'folders', label: { en: 'Parent folder', de: 'Übergeordneter Ordner' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, label: { en: 'Project', de: 'Projekt' } },
    {
      name: 'visibility',
      type: 'select',
      label: { en: 'Visibility', de: 'Sichtbarkeit' },
      defaultValue: 'INTERNAL',
      options: [
        { label: { en: 'Public', de: 'Öffentlich' }, value: 'PUBLIC' },
        { label: { en: 'Internal', de: 'Intern' }, value: 'INTERNAL' },
        { label: { en: 'Team', de: 'Team' }, value: 'TEAM' },
      ],
    },
  ],
  timestamps: true,
}