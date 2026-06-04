import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Polls: CollectionConfig = {
  slug: 'polls',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Entwurf', value: 'draft' },
        { label: 'Aktiv', value: 'active' },
        { label: 'Geschlossen', value: 'closed' },
      ],
    },
    // Per ADR: anonymous voting uses signed cookie + Redis rate limiting
    { name: 'allowAnonymous', type: 'checkbox', defaultValue: false },
    { name: 'showLiveResults', type: 'checkbox', defaultValue: false },
    { name: 'closesAt', type: 'date' },
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
    { name: 'visibilityTeam', type: 'relationship', relationTo: 'teams' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    {
      name: 'projectModule',
      type: 'group',
      fields: [
        { name: 'project', type: 'relationship', relationTo: 'projects' },
        { name: 'module', type: 'relationship', relationTo: 'project-modules' },
      ],
    },
  ],
  timestamps: true,
}
