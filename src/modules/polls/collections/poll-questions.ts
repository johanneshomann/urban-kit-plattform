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
    { name: 'poll', type: 'relationship', relationTo: 'polls', required: true, label: { en: 'Poll', de: 'Umfrage' } },
    { name: 'text', type: 'text', required: true, label: { en: 'Question', de: 'Frage' } },
    { name: 'order', type: 'number', defaultValue: 0, label: { en: 'Order', de: 'Reihenfolge' } },
    {
      name: 'type',
      type: 'select',
      label: { en: 'Answer type', de: 'Antworttyp' },
      defaultValue: 'single',
      options: [
        { label: { en: 'Single choice', de: 'Einfachauswahl' }, value: 'single' },
        { label: { en: 'Multiple choice', de: 'Mehrfachauswahl' }, value: 'multiple' },
        { label: { en: 'Free text', de: 'Freitext' }, value: 'text' },
        { label: { en: 'Scale', de: 'Skala' }, value: 'scale' },
      ],
    },
  ],
}