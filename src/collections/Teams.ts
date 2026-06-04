import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Teams: CollectionConfig = {
  slug: 'teams',
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
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
    {
      name: 'groups',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
