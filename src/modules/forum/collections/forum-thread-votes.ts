import type { CollectionConfig } from 'payload'
import { isAdmin, scopedRead } from '@/lib/access'

/** One upvote per user per thread — uniqueness enforced in the action layer. */
export const ForumThreadVotes: CollectionConfig = {
  slug: 'forum-thread-votes',
  labels: {
    singular: { en: 'Thread vote', de: 'Themenstimme' },
    plural: { en: 'Thread votes', de: 'Themenstimmen' },
  },
  access: {
    read: scopedRead({ projectPath: 'project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'thread', type: 'relationship', relationTo: 'forum-threads', required: true, label: { en: 'Thread', de: 'Thema' } },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: { en: 'User', de: 'Benutzer:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}
