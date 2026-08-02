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
    { name: 'question', type: 'relationship', relationTo: 'poll-questions', required: true, label: { en: 'Question', de: 'Frage' } },
    { name: 'text', type: 'text', required: true, label: { en: 'Option', de: 'Antwortoption' } },
    { name: 'order', type: 'number', defaultValue: 0, label: { en: 'Order', de: 'Reihenfolge' } },
  ],
}
