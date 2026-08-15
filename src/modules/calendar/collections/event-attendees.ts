// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { isAdmin, scopedRead } from '@/lib/access'

/** One row per "Ich nehme teil" — uniqueness enforced in the action layer. */
export const EventAttendees: CollectionConfig = {
  slug: 'event-attendees',
  labels: {
    singular: { en: 'Event attendee', de: 'Teilnehmer:in' },
    plural: { en: 'Event attendees', de: 'Teilnehmer:innen' },
  },
  access: {
    read: scopedRead({ projectPath: 'project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'calendar-events', required: true, label: { en: 'Event', de: 'Termin' } },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: { en: 'User', de: 'Benutzer:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}
