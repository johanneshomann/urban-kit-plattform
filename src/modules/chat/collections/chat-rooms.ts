import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

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
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'project',
      options: [
        { label: 'Projekt', value: 'project' },
        { label: 'Gruppe', value: 'group' },
        { label: 'Direktnachricht', value: 'dm' },
      ],
    },
    { name: 'name', type: 'text' },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
    // Denormalised for cheap inbox sorting + previews (avoids an N+1 over messages)
    { name: 'lastMessageAt', type: 'date' },
    { name: 'lastMessagePreview', type: 'text' },
  ],
  timestamps: true,
}
