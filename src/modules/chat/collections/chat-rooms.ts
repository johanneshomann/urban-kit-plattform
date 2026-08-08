import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'

/**
 * A chat room. One of three kinds:
 *  - `project` — created by a PM, all active project members auto-joined
 *  - `group`   — standalone, invite-only, created by a PM
 *  - `dm`      — 1:1 direct message between two users
 *
 * Membership lives in `chat-room-members`. Access to messages is enforced in the
 * route/action layer via that join table (overrideAccess), so collection-level
 * read is just "authenticated" — the API never returns a room the caller isn't in.
 */
export const ChatRooms: CollectionConfig = {
  slug: 'chat-rooms',
  labels: {
    singular: { en: 'Chat room', de: 'Chat-Raum' },
    plural: { en: 'Chat rooms', de: 'Chat-Räume' },
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    {
      name: 'type',
      type: 'select',
      label: { en: 'Type', de: 'Typ' },
      required: true,
      defaultValue: 'project',
      options: [
        { label: { en: 'Project', de: 'Projekt' }, value: 'project' },
        { label: { en: 'Group', de: 'Gruppe' }, value: 'group' },
        { label: { en: 'Direct message', de: 'Direktnachricht' }, value: 'dm' },
      ],
    },
    { name: 'name', type: 'text', label: { en: 'Name', de: 'Name' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', label: { en: 'Created by', de: 'Erstellt von' } },
    // Denormalised for cheap inbox sorting + previews (avoids an N+1 over messages)
    { name: 'lastMessageAt', type: 'date', label: { en: 'Last message at', de: 'Letzte Nachricht am' } },
    { name: 'lastMessagePreview', type: 'text', label: { en: 'Last message preview', de: 'Vorschau letzte Nachricht' } },
  ],
  timestamps: true,
}