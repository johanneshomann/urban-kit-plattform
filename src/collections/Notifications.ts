// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { ownRowsOrAdmin } from '@/lib/access'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: {
    singular: { en: 'Notification', de: 'Benachrichtigung' },
    plural: { en: 'Notifications', de: 'Benachrichtigungen' },
  },
  access: {
    // Strictly own rows — a future notification UI reads/marks/deletes only
    // the requester's notifications; admins see all.
    read: ownRowsOrAdmin(),
    create: () => false, // only via emitNotification helper
    update: ownRowsOrAdmin(),
    delete: ownRowsOrAdmin(),
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
        { label: { en: 'Member joined', de: 'Mitglied beigetreten' }, value: 'member_joined' },
      ],
    },
    { name: 'read', type: 'checkbox', defaultValue: false, label: { en: 'Read', de: 'Gelesen' } },
    {
      name: 'reference',
      type: 'group',
      fields: [
        { name: 'collectionSlug', type: 'text' },
        // NOTE: must not be named `id` — Payload reserves that name and
        // silently drops the value on save.
        { name: 'docId', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
