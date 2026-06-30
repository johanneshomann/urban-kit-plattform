import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAuthenticated } from '@/lib/access'

export const ForumThreads: CollectionConfig = {
  slug: 'forum-threads',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'content', type: 'richText', editor: lexicalEditor() },
    { name: 'category', type: 'text' },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'INTERNAL',
      options: [
        { label: 'Öffentlich', value: 'PUBLIC' },
        { label: 'Intern', value: 'INTERNAL' },
        { label: 'Team', value: 'TEAM' },
      ],
    },
    { name: 'visibilityTeam', type: 'relationship', relationTo: 'teams' },
    { name: 'pinned', type: 'checkbox', defaultValue: false },
    { name: 'locked', type: 'checkbox', defaultValue: false },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
  ],
  timestamps: true,
}
