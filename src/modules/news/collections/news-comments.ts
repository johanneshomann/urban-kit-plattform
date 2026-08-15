// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { isAdmin, scopedRead } from '@/lib/access'

export const NewsComments: CollectionConfig = {
  slug: 'news-comments',
  labels: {
    singular: { en: 'News comment', de: 'News-Kommentar' },
    plural: { en: 'News comments', de: 'News-Kommentare' },
  },
  access: {
    read: scopedRead({ visibilityPath: 'post.visibility', projectPath: 'project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
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
