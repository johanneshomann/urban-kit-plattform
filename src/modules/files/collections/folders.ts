import type { CollectionConfig } from 'payload'
import { isAdmin, scopedRead } from '@/lib/access'

export const Folders: CollectionConfig = {
  slug: 'folders',
  labels: {
    singular: { en: 'Folder', de: 'Ordner' },
    plural: { en: 'Folders', de: 'Ordner' },
  },
  access: {
    read: scopedRead({ visibilityPath: 'visibility', projectPath: 'project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true, label: { en: 'Name', de: 'Name' } },
    { name: 'parent', type: 'relationship', relationTo: 'folders', label: { en: 'Parent folder', de: 'Übergeordneter Ordner' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, label: { en: 'Project', de: 'Projekt' } },
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
  ],
  timestamps: true,
}