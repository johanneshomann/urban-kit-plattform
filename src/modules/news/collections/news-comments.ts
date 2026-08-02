import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const NewsComments: CollectionConfig = {
  slug: 'news-comments',
  labels: {
    singular: { en: 'News comment', de: 'News-Kommentar' },
    plural: { en: 'News comments', de: 'News-Kommentare' },
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'body' },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'news-posts', required: true, label: { en: 'Post', de: 'Beitrag' } },
    { name: 'body', type: 'textarea', required: true, label: { en: 'Body', de: 'Text' } },
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
    // denormalized for project-scoped moderation/cleanup queries
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}
