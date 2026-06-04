import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const ProjectModules: CollectionConfig = {
  slug: 'project-modules',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
    { name: 'moduleType', type: 'text', required: true },
    { name: 'enabled', type: 'checkbox', defaultValue: false },
  ],
}
