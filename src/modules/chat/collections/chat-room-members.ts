// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'

/**
 * Join table for chat-room membership. Powers:
 *  - access control (is this user in the room?)
 *  - unread counts (messages newer than `lastReadAt`)
 *  - typing indicator (`lastTypingAt` within the last few seconds)
 *  - presence (`lastSeenAt` heartbeat while a room is open)
 *  - group invites (`status: invited` until accepted)
 */
export const ChatRoomMembers: CollectionConfig = {
  slug: 'chat-room-members',
  labels: {
    singular: { en: 'Chat room member', de: 'Chat-Mitglied' },
    plural: { en: 'Chat room members', de: 'Chat-Mitglieder' },
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: { useAsTitle: 'id' },
  indexes: [{ fields: ['room', 'user'], unique: true }],
  fields: [
    { name: 'room', type: 'relationship', relationTo: 'chat-rooms', required: true, index: true, label: { en: 'Room', de: 'Raum' } },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true, label: { en: 'User', de: 'Benutzer:in' } },
    {
      name: 'role',
      type: 'select',
      label: { en: 'Role', de: 'Rolle' },
      defaultValue: 'member',
      options: [
        { label: { en: 'Owner', de: 'Owner' }, value: 'owner' },
        { label: { en: 'Member', de: 'Mitglied' }, value: 'member' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', de: 'Status' },
      defaultValue: 'active',
      options: [
        { label: { en: 'Active', de: 'Aktiv' }, value: 'active' },
        { label: { en: 'Invited', de: 'Eingeladen' }, value: 'invited' },
        // Durable exit: 'left' rows are never auto-resurrected by the
        // project-room sync — leaving a room sticks until an explicit rejoin
        // (or, for groups, a fresh invite).
        { label: { en: 'Left', de: 'Verlassen' }, value: 'left' },
      ],
    },
    { name: 'lastReadAt', type: 'date', label: { en: 'Last read at', de: 'Zuletzt gelesen' } },
    { name: 'lastTypingAt', type: 'date', label: { en: 'Last typing at', de: 'Zuletzt getippt' } },
    { name: 'lastSeenAt', type: 'date', label: { en: 'Last seen at', de: 'Zuletzt gesehen' } },
    { name: 'invitedBy', type: 'relationship', relationTo: 'users', label: { en: 'Invited by', de: 'Eingeladen von' } },
  ],
  timestamps: true,
}