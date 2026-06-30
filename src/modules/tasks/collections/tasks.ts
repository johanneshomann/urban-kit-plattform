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
    // Optional — fixed status columns drive the board; task-columns reserved for future custom columns.
    { name: 'column', type: 'relationship', relationTo: 'task-columns' },
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
      name: 'priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Niedrig', value: 'low' },
        { label: 'Mittel', value: 'medium' },
        { label: 'Hoch', value: 'high' },
      ],
    },
    { name: 'labels', type: 'text', hasMany: true },
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
    { name: 'project', type: 'relationship', relationTo: 'projects' },
  ],
  timestamps: true,
}
