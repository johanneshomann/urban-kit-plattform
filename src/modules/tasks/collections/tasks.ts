import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAuthenticated } from '@/lib/access'

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true, label: { en: 'Title', de: 'Titel' } },
    { name: 'description', type: 'richText', editor: lexicalEditor(), label: { en: 'Description', de: 'Beschreibung' } },
    // Optional — fixed status columns drive the board; task-columns reserved for future custom columns.
    { name: 'column', type: 'relationship', relationTo: 'task-columns', label: { en: 'Column', de: 'Spalte' } },
    { name: 'order', type: 'number', defaultValue: 0, label: { en: 'Order', de: 'Reihenfolge' } },
    { name: 'deadline', type: 'date', label: { en: 'Deadline', de: 'Fällig am' } },
    { name: 'showInCalendar', type: 'checkbox', defaultValue: false, label: { en: 'Show in calendar', de: 'Im Kalender zeigen' } },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', de: 'Status' },
      defaultValue: 'todo',
      options: [
        { label: { en: 'Open', de: 'Offen' }, value: 'todo' },
        { label: { en: 'In progress', de: 'In Bearbeitung' }, value: 'in_progress' },
        { label: { en: 'Done', de: 'Erledigt' }, value: 'done' },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      label: { en: 'Priority', de: 'Priorität' },
      defaultValue: 'medium',
      options: [
        { label: { en: 'Low', de: 'Niedrig' }, value: 'low' },
        { label: { en: 'Medium', de: 'Mittel' }, value: 'medium' },
        { label: { en: 'High', de: 'Hoch' }, value: 'high' },
      ],
    },
    { name: 'labels', type: 'text', hasMany: true, label: { en: 'Labels', de: 'Labels' } },
    {
      name: 'visibility',
      type: 'select',
      label: { en: 'Visibility', de: 'Sichtbarkeit' },
      defaultValue: 'INTERNAL',
      options: [
        { label: { en: 'Internal', de: 'Intern' }, value: 'INTERNAL' },
        { label: { en: 'Team', de: 'Team' }, value: 'TEAM' },
      ],
    },
    { name: 'visibilityTeam', type: 'relationship', relationTo: 'teams', label: { en: 'Team (visibility)', de: 'Team (Sichtbarkeit)' } },
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
    {
      name: 'dependencies',
      type: 'relationship',
      relationTo: 'tasks',
      hasMany: true,
      label: { en: 'Dependencies', de: 'Abhängigkeiten' },
    },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}