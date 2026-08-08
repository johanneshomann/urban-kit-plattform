import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdmin, scopedRead } from '@/lib/access'

export const ForumThreads: CollectionConfig = {
  slug: 'forum-threads',
  labels: {
    singular: { en: 'Forum thread', de: 'Forumsthema' },
    plural: { en: 'Forum threads', de: 'Forumsthemen' },
  },
  access: {
    read: scopedRead({ visibilityPath: 'visibility', projectPath: 'project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true, label: { en: 'Title', de: 'Titel' } },
    { name: 'slug', type: 'text', required: true, label: { en: 'Slug', de: 'Slug' } },
    { name: 'content', type: 'richText', editor: lexicalEditor(), label: { en: 'Content', de: 'Inhalt' } },
    { name: 'category', type: 'text', label: { en: 'Category', de: 'Kategorie' } },
    {
      name: 'visibility',
      type: 'select',
      label: { en: 'Visibility', de: 'Sichtbarkeit' },
      defaultValue: 'PROJECT',
      options: [
        { label: { en: 'Public', de: 'Öffentlich' }, value: 'PUBLIC' },
        { label: { en: 'Project (members)', de: 'Projekt (Mitglieder)' }, value: 'PROJECT' },
        { label: { en: 'Team (selected)', de: 'Team (ausgewählt)' }, value: 'TEAM' },
      ],
    },
    {
      name: 'visibilityTeams',
      type: 'text',
      hasMany: true,
      label: { en: 'Teams (visibility)', de: 'Teams (Sichtbarkeit)' },
      admin: {
        description: {
          en: 'Team tags that may see this content when visibility is "TEAM" (must be in the project team catalog).',
          de: 'Team-Tags mit Zugriff, wenn die Sichtbarkeit "TEAM" ist (müssen im Projekt-Team-Katalog stehen).',
        },
      },
    },
    { name: 'pinned', type: 'checkbox', defaultValue: false, label: { en: 'Pinned', de: 'Angepinnt' } },
    { name: 'locked', type: 'checkbox', defaultValue: false, label: { en: 'Locked', de: 'Gesperrt' } },
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}