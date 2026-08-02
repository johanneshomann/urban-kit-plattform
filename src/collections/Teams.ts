import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Teams: CollectionConfig = {
  slug: 'teams',
  labels: {
    singular: { en: 'Team', de: 'Team' },
    plural: { en: 'Teams', de: 'Teams' },
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: { en: 'Name', de: 'Name' } },
    { name: 'slug', type: 'text', required: true, label: { en: 'Slug', de: 'Slug' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, label: { en: 'Project', de: 'Projekt' } },
    {
      name: 'groups',
      type: 'array',
      label: { en: 'Groups', de: 'Gruppen' },
      fields: [
        { name: 'name', type: 'text', required: true, label: { en: 'Name', de: 'Name' } },
        { name: 'description', type: 'textarea', label: { en: 'Description', de: 'Beschreibung' } },
      ],
    },
  ],
}
