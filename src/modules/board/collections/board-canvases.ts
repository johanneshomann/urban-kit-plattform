import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const BoardCanvases: CollectionConfig = {
  slug: 'board-canvases',
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true },
    // ADR-2: yjs_updates is the authoritative source of truth (written by Hocuspocus extension).
    // snapshot is derived — rebuilt from the Yjs log on demand, NEVER written independently.
    { name: 'snapshot', type: 'json', admin: { description: 'Derived from Yjs log. Do not write directly.' } },
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
