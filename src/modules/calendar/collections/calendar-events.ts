import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAuthenticated } from '@/lib/access'

export const CalendarEvents: CollectionConfig = {
  slug: 'calendar-events',
  labels: {
    singular: { en: 'Calendar event', de: 'Termin' },
    plural: { en: 'Calendar events', de: 'Termine' },
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
    { name: 'startDate', type: 'date', required: true, label: { en: 'Start date', de: 'Beginn' } },
    { name: 'endDate', type: 'date', label: { en: 'End date', de: 'Ende' } },
    { name: 'allDay', type: 'checkbox', defaultValue: false, label: { en: 'All day', de: 'Ganztägig' } },
    { name: 'location', type: 'text', label: { en: 'Location', de: 'Ort' } },
    { name: 'category', type: 'text', label: { en: 'Category', de: 'Kategorie' } },
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
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}