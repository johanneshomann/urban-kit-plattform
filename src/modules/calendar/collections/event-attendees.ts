import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

/** One row per "Ich nehme teil" — uniqueness enforced in the action layer. */
export const EventAttendees: CollectionConfig = {
  slug: 'event-attendees',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'calendar-events', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
  ],
  timestamps: true,
}
