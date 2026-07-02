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
    // ADR-2 (Mongo addendum): the authoritative Yjs document state, base64-encoded.
    // Written only by the Hocuspocus Database extension via /api/internal/board-doc.
    { name: 'yjsState', type: 'text', admin: { description: 'Base64 Yjs state. Written by the realtime sidecar; do not edit.' } },
    // Derived preview — rebuilt from the Yjs state on demand, never written independently.
    { name: 'snapshot', type: 'json', admin: { description: 'Derived from Yjs state. Do not write directly.' } },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
  ],
  timestamps: true,
}
