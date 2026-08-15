// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'

export const ChatMessages: CollectionConfig = {
  slug: 'chat-messages',
  labels: {
    singular: { en: 'Chat message', de: 'Chat-Nachricht' },
    plural: { en: 'Chat messages', de: 'Chat-Nachrichten' },
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'room', type: 'relationship', relationTo: 'chat-rooms', required: true, index: true, label: { en: 'Room', de: 'Raum' } },
    { name: 'content', type: 'textarea', label: { en: 'Content', de: 'Inhalt' } },
    { name: 'author', type: 'relationship', relationTo: 'users', required: true, label: { en: 'Author', de: 'Autor:in' } },
    { name: 'attachment', type: 'upload', relationTo: 'media', label: { en: 'Attachment', de: 'Anhang' } },
    // Embedded reactions — one row per user+emoji. Low volume; avoids an extra
    // collection round-trip when polling messages.
    {
      name: 'reactions',
      type: 'array',
      label: { en: 'Reactions', de: 'Reaktionen' },
      fields: [
        { name: 'emoji', type: 'text', required: true, label: { en: 'Emoji', de: 'Emoji' } },
        { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: { en: 'User', de: 'Benutzer:in' } },
      ],
    },
    // Cross-module content reference — resolved via resolveReference at render time
    { name: 'referenceCollection', type: 'text', label: { en: 'Reference collection', de: 'Referenz-Collection' } },
    { name: 'referenceId', type: 'text', label: { en: 'Reference ID', de: 'Referenz-ID' } },
    // Content mentions (project rooms / project-assigned groups): snapshots of
    // referenced module content — title and workspace-relative href are
    // captured at send time, so later renames/deletions never break messages.
    {
      name: 'mentions',
      type: 'array',
      label: { en: 'Content mentions', de: 'Inhalts-Erwähnungen' },
      fields: [
        { name: 'module', type: 'text', required: true, label: { en: 'Module', de: 'Modul' } },
        { name: 'docId', type: 'text', required: true, label: { en: 'Document ID', de: 'Dokument-ID' } },
        { name: 'title', type: 'text', required: true, label: { en: 'Title', de: 'Titel' } },
        { name: 'href', type: 'text', required: true, label: { en: 'Href', de: 'Href' } },
      ],
    },
  ],
  timestamps: true,
}
