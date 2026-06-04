import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAuthenticated } from '@/lib/access'

export const ForumComments: CollectionConfig = {
  slug: 'forum-comments',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'thread', type: 'relationship', relationTo: 'forum-threads', required: true },
    { name: 'content', type: 'richText', editor: lexicalEditor(), required: true },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
