// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import path from 'path'
import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { en: 'Media', de: 'Medium' },
    plural: { en: 'Media', de: 'Medien' },
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'filename' },
  // Absolute path so dev and the Docker container (cwd /app, volume at
  // /app/media) write to the same place regardless of config-dir resolution
  upload: { staticDir: path.resolve(process.cwd(), 'media') },
  fields: [
    { name: 'alt', type: 'text', label: { en: 'Alt text', de: 'Alt-Text' } },
    { name: 'folder', type: 'relationship', relationTo: 'folders', label: { en: 'Folder', de: 'Ordner' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
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
    { name: 'uploadedBy', type: 'relationship', relationTo: 'users', label: { en: 'Uploaded by', de: 'Hochgeladen von' } },
  ],
}
