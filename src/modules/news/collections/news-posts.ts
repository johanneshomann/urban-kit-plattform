import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAuthenticated } from '@/lib/access'

export const NewsPosts: CollectionConfig = {
  slug: 'news-posts',
  labels: {
    singular: { en: 'News post', de: 'News-Beitrag' },
    plural: { en: 'News posts', de: 'News-Beiträge' },
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true, label: { en: 'Title', de: 'Titel' } },
    { name: 'slug', type: 'text', required: true, label: { en: 'Slug', de: 'Slug' } },
    { name: 'content', type: 'richText', editor: lexicalEditor(), label: { en: 'Content', de: 'Inhalt' } },
    { name: 'featuredImage', type: 'upload', relationTo: 'media', label: { en: 'Featured image', de: 'Titelbild' } },
    {
      name: 'visibility',
      type: 'select',
      label: { en: 'Visibility', de: 'Sichtbarkeit' },
      defaultValue: 'INTERNAL',
      options: [
        { label: { en: 'Public', de: 'Öffentlich' }, value: 'PUBLIC' },
        { label: { en: 'Internal', de: 'Intern' }, value: 'INTERNAL' },
        { label: { en: 'Team', de: 'Team' }, value: 'TEAM' },
      ],
    },
    { name: 'visibilityTeam', type: 'relationship', relationTo: 'teams', label: { en: 'Team (visibility)', de: 'Team (Sichtbarkeit)' } },
    { name: 'publishedAt', type: 'date', label: { en: 'Published at', de: 'Veröffentlicht am' } },
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}