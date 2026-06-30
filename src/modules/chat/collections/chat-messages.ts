import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const ChatMessages: CollectionConfig = {
  slug: 'chat-messages',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'room', type: 'relationship', relationTo: 'chat-rooms', required: true, index: true },
    { name: 'content', type: 'textarea' },
    { name: 'author', type: 'relationship', relationTo: 'users', required: true },
    { name: 'attachment', type: 'upload', relationTo: 'media' },
    // Embedded reactions — one row per user+emoji. Low volume; avoids an extra
    // collection round-trip when polling messages.
    {
      name: 'reactions',
      type: 'array',
      fields: [
        { name: 'emoji', type: 'text', required: true },
        { name: 'user', type: 'relationship', relationTo: 'users', required: true },
      ],
    },
    // Cross-module content reference — resolved via resolveReference at render time
    { name: 'referenceCollection', type: 'text' },
    { name: 'referenceId', type: 'text' },
  ],
  timestamps: true,
}
