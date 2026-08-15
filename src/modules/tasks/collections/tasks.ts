// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdmin, scopedRead } from '@/lib/access'

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  labels: {
    singular: { en: 'Task', de: 'Aufgabe' },
    plural: { en: 'Tasks', de: 'Aufgaben' },
  },
  access: {
    read: scopedRead({ projectPath: 'project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
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
      // Tasks are team-only by design — no PUBLIC option.
      name: 'visibility',
      type: 'select',
      label: { en: 'Visibility', de: 'Sichtbarkeit' },
      defaultValue: 'PROJECT',
      options: [
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