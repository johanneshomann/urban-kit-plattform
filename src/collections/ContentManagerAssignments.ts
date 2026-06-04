import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const ContentManagerAssignments: CollectionConfig = {
  slug: 'content-manager-assignments',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
    { name: 'team', type: 'relationship', relationTo: 'teams', required: true },
  ],
}
