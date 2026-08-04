import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const Polls: CollectionConfig = {
  slug: 'polls',
  labels: {
    singular: { en: 'Poll', de: 'Umfrage' },
    plural: { en: 'Polls', de: 'Umfragen' },
  },
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
    { name: 'author', type: 'relationship', relationTo: 'users', label: { en: 'Author', de: 'Autor:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: { en: 'Project', de: 'Projekt' } },
  ],
  timestamps: true,
}