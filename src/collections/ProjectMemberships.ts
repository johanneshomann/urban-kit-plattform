import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const ProjectMemberships: CollectionConfig = {
  slug: 'project-memberships',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Projektmanager', value: 'PM' },
        { label: 'Content Manager', value: 'CM' },
        { label: 'Bürger:in', value: 'Citizen' },
        { label: 'Follower', value: 'Follower' },
      ],
    },
  ],
}
