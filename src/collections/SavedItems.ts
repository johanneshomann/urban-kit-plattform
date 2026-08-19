// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import type { CollectionConfig } from 'payload'
import { ownRowsOrAdmin } from '@/lib/access'

/**
 * Personal bookmarks ("Merkliste"): one row = one user saved one piece of
 * project content. Title/href are display snapshots taken at save time; the
 * Merkliste page re-checks the underlying doc's visibility before rendering.
 */
export const SavedItems: CollectionConfig = {
  slug: 'saved-items',
  labels: {
    singular: { en: 'Saved item', de: 'Merklisten-Eintrag' },
    plural: { en: 'Saved items', de: 'Merklisten-Einträge' },
  },
  access: {
    // Strictly own rows; writes go through the server action (visibility check).
    read: ownRowsOrAdmin(),
    create: () => false,
    update: () => false,
    delete: ownRowsOrAdmin(),
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true, label: { en: 'User', de: 'Benutzer:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true, label: { en: 'Project', de: 'Projekt' } },
    { name: 'module', type: 'text', required: true, label: { en: 'Module', de: 'Modul' } },
    { name: 'item', type: 'text', required: true, label: { en: 'Item id', de: 'Eintrag-Id' } },
    { name: 'title', type: 'text', label: { en: 'Title snapshot', de: 'Titel (Snapshot)' } },
    { name: 'href', type: 'text', label: { en: 'Workspace link', de: 'Workspace-Link' } },
  ],
}
