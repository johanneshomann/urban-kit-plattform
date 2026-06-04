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
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Eingeladen', value: 'invited' },
        { label: 'Aufgabe zugewiesen', value: 'task_assigned' },
        { label: 'Umfrage beendet', value: 'poll_closed' },
        { label: 'Beitrittsanfrage', value: 'join_request' },
        { label: 'Neuer Inhalt', value: 'new_content' },
      ],
    },
    { name: 'read', type: 'checkbox', defaultValue: false },
    {
      name: 'reference',
      type: 'group',
      fields: [
        { name: 'collection', type: 'text' },
        { name: 'id', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
