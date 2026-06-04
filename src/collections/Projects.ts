import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea' },
    { name: 'colorScheme', type: 'relationship', relationTo: 'color-schemes' },
    { name: 'isPublic', type: 'checkbox', defaultValue: true },
    { name: 'joinRequestsEnabled', type: 'checkbox', defaultValue: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Aktiv', value: 'active' },
        { label: 'In Planung', value: 'planning' },
        { label: 'Abgeschlossen', value: 'completed' },
        { label: 'Archiviert', value: 'archived' },
      ],
    },
    {
      name: 'thema',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Mobilität', value: 'mobilitaet' },
        { label: 'Wohnraum', value: 'wohnraum' },
        { label: 'Grünflächen', value: 'gruenflaechen' },
        { label: 'Infrastruktur', value: 'infrastruktur' },
        { label: 'Stadtentwicklung', value: 'stadtentwicklung' },
        { label: 'Kultur', value: 'kultur' },
        { label: 'Bildung', value: 'bildung' },
        { label: 'Umwelt', value: 'umwelt' },
      ],
    },
    { name: 'startYear', type: 'number' },
    {
      name: 'stadtbereich',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Innenstadt', value: 'innenstadt' },
        { label: 'Norden', value: 'norden' },
        { label: 'Süden', value: 'sueden' },
        { label: 'Osten', value: 'osten' },
        { label: 'Westen', value: 'westen' },
        { label: 'Gesamtstadt', value: 'gesamtstadt' },
      ],
    },
  ],
}
