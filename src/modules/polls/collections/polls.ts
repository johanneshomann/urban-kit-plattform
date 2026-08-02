import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Polls: CollectionConfig = {
  slug: 'polls',
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true, label: { en: 'Title', de: 'Titel' } },
    { name: 'slug', type: 'text', required: true, label: { en: 'Slug', de: 'Slug' } },
    { name: 'description', type: 'textarea', label: { en: 'Description', de: 'Beschreibung' } },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', de: 'Status' },
      defaultValue: 'draft',
      options: [
        { label: { en: 'Draft', de: 'Entwurf' }, value: 'draft' },
        { label: { en: 'Active', de: 'Aktiv' }, value: 'active' },
        { label: { en: 'Closed', de: 'Geschlossen' }, value: 'closed' },
      ],
    },
    // Per ADR: anonymous voting uses signed cookie + Redis rate limiting
    { name: 'allowAnonymous', type: 'checkbox', defaultValue: false, label: { en: 'Allow anonymous', de: 'Anonym erlauben' } },
    { name: 'showLiveResults', type: 'checkbox', defaultValue: false, label: { en: 'Show live results', de: 'Live-Ergebnisse zeigen' } },
    { name: 'closesAt', type: 'date', label: { en: 'Closes at', de: 'Endet am' } },
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
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}