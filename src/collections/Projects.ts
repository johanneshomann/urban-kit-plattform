import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'
import { projectDefaults } from '@/lib/defaults/project'
import { defaultColorSchemes } from '@/lib/defaults/colorSchemes'
import {
  DEFAULT_PROJEKTPHASE,
  projektphaseOptions,
  statusFromProjektphase,
} from '@/lib/options/projektphasen'
import { ensureDefaultMedia, DEFAULT_GALLERY_KEYS } from '@/lib/defaults/media'
import {
  THEMA_OPTIONS,
  STADTBEREICH_OPTIONS,
  ALTERSGRUPPE_OPTIONS,
  GENDER_OPTIONS,
} from '@/lib/options/project-fields'

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
  hooks: {
    beforeChange: [
      ({ data }) => {
        // `status` is derived from the current Projektphase — editors only
        // ever set the phase. See @/lib/options/projektphasen.
        data.status = statusFromProjektphase(data.projektphase)
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      defaultValue: async ({ req }) => {
        try {
          return (await ensureDefaultMedia(req.payload)).cover
        } catch {
          return undefined
        }
      },
    },
    {
      name: 'gallery',
      type: 'array',
      defaultValue: async ({ req }) => {
        try {
          const media = await ensureDefaultMedia(req.payload)
          return DEFAULT_GALLERY_KEYS.map((key) => ({ image: media[key], caption: '' }))
        } catch {
          return undefined
        }
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'shortDescription', type: 'text', defaultValue: projectDefaults.shortDescription },
    {
      name: 'colorScheme',
      type: 'select',
      defaultValue: projectDefaults.colorScheme,
      options: defaultColorSchemes.map((s) => ({ label: s.name, value: s.name })),
      admin: {
        components: {
          Field: '@/components/payload/ColorSchemeField#ColorSchemeField',
        },
      },
    },
    { name: 'isPublic', type: 'checkbox', defaultValue: projectDefaults.isPublic },
    { name: 'joinRequestsEnabled', type: 'checkbox', defaultValue: projectDefaults.joinRequestsEnabled },
    {
      name: 'projektphase',
      type: 'select',
      defaultValue: DEFAULT_PROJEKTPHASE,
      options: projektphaseOptions,
      admin: {
        description:
          'Aktuelle Phase im Beteiligungsprozess. Bestimmt automatisch den Status des Projekts.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: projectDefaults.status,
      admin: {
        components: {
          Field: '@/components/payload/StatusField#StatusField',
        },
      },
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
      options: THEMA_OPTIONS,
    },
    { name: 'startYear', type: 'number' },
    {
      name: 'modules',
      type: 'select',
      hasMany: true,
      defaultValue: ['news', 'calendar'],
      options: [
        { label: 'News', value: 'news' },
        { label: 'Kalender', value: 'calendar' },
        { label: 'Umfragen', value: 'polls' },
        { label: 'Forum', value: 'forum' },
        { label: 'Aufgaben', value: 'tasks' },
        { label: 'Chat', value: 'chat' },
        { label: 'Board', value: 'board' },
        { label: 'Dateien', value: 'files' },
        { label: 'Urban Agent', value: 'urban-agent' },
      ],
    },
    { name: 'projektbeschreibung', type: 'richText', defaultValue: projectDefaults.projektbeschreibung },
    { name: 'beteiligungsvorhaben', type: 'richText' },
    {
      name: 'altersgruppe',
      type: 'select',
      hasMany: true,
      defaultValue: projectDefaults.altersgruppe,
      options: ALTERSGRUPPE_OPTIONS,
    },
    {
      name: 'gender',
      type: 'select',
      hasMany: true,
      defaultValue: projectDefaults.gender,
      options: GENDER_OPTIONS,
    },
    { name: 'ansprechperson', type: 'relationship', relationTo: 'users' },
    {
      name: 'kontakt',
      type: 'group',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'telefon', type: 'text' },
        { name: 'website', type: 'text' },
      ],
    },
    {
      name: 'members',
      type: 'join',
      collection: 'project-memberships',
      on: 'project',
    },
    {
      name: 'stadtbereich',
      type: 'select',
      hasMany: true,
      options: STADTBEREICH_OPTIONS,
    },
  ],
}
