// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { isAdmin, scopedRead } from '@/lib/access'

export const BoardCanvases: CollectionConfig = {
  slug: 'board-canvases',
  labels: {
    singular: { en: 'Board', de: 'Board' },
    plural: { en: 'Boards', de: 'Boards' },
  },
  access: {
    read: scopedRead({ projectPath: 'project' }),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', required: true, label: { en: 'Name', de: 'Name' } },
    // ADR-2 (Mongo addendum): the authoritative Yjs document state, base64-encoded.
    // Written only by the Hocuspocus Database extension via /api/internal/board-doc.
    { name: 'yjsState', type: 'text', label: { en: 'Yjs state', de: 'Yjs-Zustand' }, admin: { description: { en: 'Base64 Yjs state. Written by the realtime sidecar; do not edit.', de: 'Base64-Yjs-Zustand. Wird vom Realtime-Sidecar geschrieben; nicht bearbeiten.' } } },
    // Derived preview — rebuilt from the Yjs state on demand, never written independently.
    { name: 'snapshot', type: 'json', label: { en: 'Snapshot', de: 'Vorschau' }, admin: { description: { en: 'Derived from Yjs state. Do not write directly.', de: 'Wird aus dem Yjs-Zustand abgeleitet. Nicht direkt schreiben.' } } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}