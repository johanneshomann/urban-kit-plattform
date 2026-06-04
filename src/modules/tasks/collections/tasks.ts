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
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'richText', editor: lexicalEditor() },
    { name: 'column', type: 'relationship', relationTo: 'task-columns', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'deadline', type: 'date' },
    { name: 'showInCalendar', type: 'checkbox', defaultValue: false },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'todo',
      options: [
        { label: 'Offen', value: 'todo' },
        { label: 'In Bearbeitung', value: 'in_progress' },
        { label: 'Erledigt', value: 'done' },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'INTERNAL',
      options: [
        { label: 'Intern', value: 'INTERNAL' },
        { label: 'Team', value: 'TEAM' },
      ],
    },
    { name: 'visibilityTeam', type: 'relationship', relationTo: 'teams' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    {
      name: 'dependencies',
      type: 'relationship',
      relationTo: 'tasks',
      hasMany: true,
    },
    {
      name: 'projectModule',
      type: 'group',
      fields: [
        { name: 'project', type: 'relationship', relationTo: 'projects' },
        { name: 'module', type: 'relationship', relationTo: 'project-modules' },
      ],
    },
  ],
  timestamps: true,
}
