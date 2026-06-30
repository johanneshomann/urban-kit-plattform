import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const NewsComments: CollectionConfig = {
  slug: 'news-comments',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'body' },
  fields: [
    { name: 'post', type: 'relationship', relationTo: 'news-posts', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    // denormalized for project-scoped moderation/cleanup queries
    { name: 'project', type: 'relationship', relationTo: 'projects' },
  ],
  timestamps: true,
}
