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
    { name: 'channel', type: 'relationship', relationTo: 'chat-channels', required: true },
    { name: 'content', type: 'textarea', required: true },
    { name: 'author', type: 'relationship', relationTo: 'users', required: true },
    { name: 'attachment', type: 'upload', relationTo: 'media' },
    // Cross-module content reference — resolved via resolveReference at render time
    { name: 'referenceCollection', type: 'text' },
    { name: 'referenceId', type: 'text' },
  ],
  timestamps: true,
}
