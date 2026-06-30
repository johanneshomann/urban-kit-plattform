import type { CollectionConfig } from 'payload'
import path from 'path'
import { isAuthenticated } from '@/lib/access'

/**
 * Project document library. Payload upload collection (local disk for now —
 * `@payloadcms/storage-s3` can later route this to MinIO without UI changes).
 * `filename`, `mimeType`, `filesize`, `url` are managed by Payload's upload.
 */
export const FileUploads: CollectionConfig = {
  slug: 'file-uploads',
  access: {
    // Authenticated users may read all (UI gates by tier); logged-out only PUBLIC.
    read: ({ req: { user } }) => (user ? true : { visibility: { equals: 'PUBLIC' } }),
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'filename' },
  upload: { staticDir: path.resolve(process.cwd(), 'uploads/files') },
  fields: [
    { name: 'label', type: 'text' }, // optional friendly display name
    { name: 'folder', type: 'relationship', relationTo: 'folders' },
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
    { name: 'project', type: 'relationship', relationTo: 'projects' },
  ],
  timestamps: true,
}
