import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  access: {
    read: isAuthenticated,
    create: () => false, // only via emitNotification helper
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: { en: 'User', de: 'Benutzer:in' } },
    {
      name: 'type',
      type: 'select',
      label: { en: 'Type', de: 'Typ' },
      required: true,
      options: [
        { label: { en: 'Invited', de: 'Eingeladen' }, value: 'invited' },
        { label: { en: 'Task assigned', de: 'Aufgabe zugewiesen' }, value: 'task_assigned' },
        { label: { en: 'Poll closed', de: 'Umfrage beendet' }, value: 'poll_closed' },
        { label: { en: 'Join request', de: 'Beitrittsanfrage' }, value: 'join_request' },
        { label: { en: 'New content', de: 'Neuer Inhalt' }, value: 'new_content' },
      ],
    },
    { name: 'read', type: 'checkbox', defaultValue: false, label: { en: 'Read', de: 'Gelesen' } },
    {
      name: 'reference',
      type: 'group',
      fields: [
        { name: 'collectionSlug', type: 'text' },
        { name: 'id', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
