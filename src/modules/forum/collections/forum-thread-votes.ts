import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

/** One upvote per user per thread — uniqueness enforced in the action layer. */
export const ForumThreadVotes: CollectionConfig = {
  slug: 'forum-thread-votes',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'thread', type: 'relationship', relationTo: 'forum-threads', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
  ],
  timestamps: true,
}
