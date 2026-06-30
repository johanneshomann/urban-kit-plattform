import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

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
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'id' },
  indexes: [{ fields: ['room', 'user'], unique: true }],
  fields: [
    { name: 'room', type: 'relationship', relationTo: 'chat-rooms', required: true, index: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'member',
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Mitglied', value: 'member' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Aktiv', value: 'active' },
        { label: 'Eingeladen', value: 'invited' },
      ],
    },
    { name: 'lastReadAt', type: 'date' },
    { name: 'lastTypingAt', type: 'date' },
    { name: 'lastSeenAt', type: 'date' },
    { name: 'invitedBy', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
