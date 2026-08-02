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
    { name: 'thread', type: 'relationship', relationTo: 'forum-threads', required: true, label: { en: 'Thread', de: 'Thema' } },
    { name: 'content', type: 'richText', editor: lexicalEditor(), required: true, label: { en: 'Content', de: 'Inhalt' } },
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
  ],
  timestamps: true,
}
