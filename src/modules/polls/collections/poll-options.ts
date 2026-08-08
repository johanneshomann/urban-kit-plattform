import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'

export const PollOptions: CollectionConfig = {
  slug: 'poll-options',
  labels: {
    singular: { en: 'Poll option', de: 'Umfrageoption' },
    plural: { en: 'Poll options', de: 'Umfrageoptionen' },
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'question', type: 'relationship', relationTo: 'poll-questions', required: true, label: { en: 'Question', de: 'Frage' } },
    { name: 'text', type: 'text', required: true, label: { en: 'Option', de: 'Antwortoption' } },
    { name: 'order', type: 'number', defaultValue: 0, label: { en: 'Order', de: 'Reihenfolge' } },
  ],
}
