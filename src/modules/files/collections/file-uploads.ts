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
    { name: 'uploadedBy', type: 'relationship', relationTo: 'users', label: { en: 'Uploaded by', de: 'Hochgeladen von' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}
