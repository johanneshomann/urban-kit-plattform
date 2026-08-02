import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

/** One upvote per user per thread — uniqueness enforced in the action layer. */
export const ForumThreadVotes: CollectionConfig = {
  slug: 'forum-thread-votes',
  labels: {
    singular: { en: 'Thread vote', de: 'Themenstimme' },
    plural: { en: 'Thread votes', de: 'Themenstimmen' },
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'thread', type: 'relationship', relationTo: 'forum-threads', required: true, label: { en: 'Thread', de: 'Thema' } },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: { en: 'User', de: 'Benutzer:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}
