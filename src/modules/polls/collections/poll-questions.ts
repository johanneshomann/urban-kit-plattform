// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'

export const PollQuestions: CollectionConfig = {
  slug: 'poll-questions',
  labels: {
    singular: { en: 'Poll question', de: 'Umfragefrage' },
    plural: { en: 'Poll questions', de: 'Umfragefragen' },
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
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