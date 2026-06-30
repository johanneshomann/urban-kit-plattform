import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const ChatChannels: CollectionConfig = {
  slug: 'chat-channels',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'scope',
      type: 'select',
      defaultValue: 'project',
      options: [
        { label: 'Projekt', value: 'project' },
        { label: 'Team', value: 'team' },
      ],
    },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
    { name: 'team', type: 'relationship', relationTo: 'teams' },
  ],
  timestamps: true,
}
