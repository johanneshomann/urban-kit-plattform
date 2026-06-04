import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const PollQuestions: CollectionConfig = {
  slug: 'poll-questions',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'poll', type: 'relationship', relationTo: 'polls', required: true },
    { name: 'text', type: 'text', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'single',
      options: [
        { label: 'Einfachauswahl', value: 'single' },
        { label: 'Mehrfachauswahl', value: 'multiple' },
        { label: 'Freitext', value: 'text' },
        { label: 'Skala', value: 'scale' },
      ],
    },
  ],
}
