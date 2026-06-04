import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const PollOptions: CollectionConfig = {
  slug: 'poll-options',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'question', type: 'relationship', relationTo: 'poll-questions', required: true },
    { name: 'text', type: 'text', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
