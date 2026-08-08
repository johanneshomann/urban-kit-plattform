import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdmin, scopedRead } from '@/lib/access'

export const ForumComments: CollectionConfig = {
  slug: 'forum-comments',
  labels: {
    singular: { en: 'Forum comment', de: 'Forenkommentar' },
    plural: { en: 'Forum comments', de: 'Forenkommentare' },
  },
  access: {
    read: scopedRead({ visibilityPath: 'thread.visibility', projectPath: 'thread.project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'thread', type: 'relationship', relationTo: 'forum-threads', required: true, label: { en: 'Thread', de: 'Thema' } },
    { name: 'content', type: 'richText', editor: lexicalEditor(), required: true, label: { en: 'Content', de: 'Inhalt' } },
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
  ],
  timestamps: true,
}
