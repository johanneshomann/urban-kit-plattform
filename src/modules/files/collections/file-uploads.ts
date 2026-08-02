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
  labels: {
    singular: { en: 'File', de: 'Datei' },
    plural: { en: 'Files', de: 'Dateien' },
  },
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
    { name: 'label', type: 'text', label: { en: 'Label', de: 'Bezeichnung' } }, // optional friendly display name
    { name: 'folder', type: 'relationship', relationTo: 'folders', label: { en: 'Folder', de: 'Ordner' } },
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
    { name: 'uploadedBy', type: 'relationship', relationTo: 'users', label: { en: 'Uploaded by', de: 'Hochgeladen von' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}
