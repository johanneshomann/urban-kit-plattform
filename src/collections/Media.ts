import path from 'path'
import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
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
    { name: 'alt', type: 'text' },
    { name: 'folder', type: 'relationship', relationTo: 'folders' },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
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
    { name: 'uploadedBy', type: 'relationship', relationTo: 'users' },
  ],
}
