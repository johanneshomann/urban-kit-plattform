import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const FileUploads: CollectionConfig = {
  slug: 'file-uploads',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'filename' },
  fields: [
    { name: 'filename', type: 'text', required: true },
    { name: 'mimeType', type: 'text' },
    { name: 'filesize', type: 'number' },
    // S3 key — actual file stored in MinIO
    { name: 's3Key', type: 'text', required: true },
    { name: 'folder', type: 'relationship', relationTo: 'folders' },
    // Visibility inherited from parent folder; can be overridden
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
    { name: 'visibilityTeam', type: 'relationship', relationTo: 'teams' },
    { name: 'uploadedBy', type: 'relationship', relationTo: 'users' },
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
