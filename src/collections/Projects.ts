import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'
import { projectDefaults } from '@/lib/defaults/project'
import { defaultColorSchemes } from '@/lib/defaults/colorSchemes'
import {
  DEFAULT_PROJEKTPHASE,
  projektphaseOptionsLocalized,
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
  labels: {
    singular: { en: 'Project', de: 'Projekt' },
    plural: { en: 'Projects', de: 'Projekte' },
  },
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
    { name: 'title', type: 'text', required: true, label: { en: 'Title', de: 'Titel' } },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Cover image', de: 'Titelbild' },
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
      label: { en: 'Gallery', de: 'Galerie' },
      labels: {
        singular: { en: 'Gallery image', de: 'Galeriebild' },
        plural: { en: 'Gallery images', de: 'Galeriebilder' },
      },
      defaultValue: async ({ req }) => {
        try {
          const media = await ensureDefaultMedia(req.payload)
          return DEFAULT_GALLERY_KEYS.map((key) => ({ image: media[key], caption: '' }))
        } catch {
          return undefined
        }
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: { en: 'Image', de: 'Bild' } },
        { name: 'caption', type: 'text', label: { en: 'Caption', de: 'Bildunterschrift' } },
      ],
    },
    { name: 'slug', type: 'text', required: true, unique: true, label: { en: 'Slug', de: 'Slug' } },
    {
      name: 'shortDescription',
      type: 'text',
      label: { en: 'Short description', de: 'Kurzbeschreibung' },
      defaultValue: projectDefaults.shortDescription,
    },
    {
      name: 'colorScheme',
      type: 'select',
      label: { en: 'Color scheme', de: 'Farbschema' },
      defaultValue: projectDefaults.colorScheme,
      options: defaultColorSchemes.map((s) => ({ label: s.name, value: s.name })),
      admin: {
        components: {
          Field: '@/components/payload/ColorSchemeField#ColorSchemeField',
        },
      },
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      label: { en: 'Publicly visible', de: 'Öffentlich sichtbar' },
      defaultValue: projectDefaults.isPublic,
    },
    {
      name: 'joinRequestsEnabled',
      type: 'checkbox',
      label: { en: 'Allow join requests', de: 'Beitrittsanfragen erlauben' },
      defaultValue: projectDefaults.joinRequestsEnabled,
    },
    {
      name: 'projektphase',
      type: 'select',
      label: { en: 'Project phase', de: 'Projektphase' },
      defaultValue: DEFAULT_PROJEKTPHASE,
      options: projektphaseOptionsLocalized,
      admin: {
        description: {
          en: 'Current phase of the participation process. Automatically determines the project status.',
          de: 'Aktuelle Phase im Beteiligungsprozess. Bestimmt automatisch den Status des Projekts.',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', de: 'Status' },
      defaultValue: projectDefaults.status,
      admin: {
        components: {
          Field: '@/components/payload/StatusField#StatusField',
        },
      },
      options: [
        { label: { en: 'Active', de: 'Aktiv' }, value: 'active' },
        { label: { en: 'In planning', de: 'In Planung' }, value: 'planning' },
        { label: { en: 'Completed', de: 'Abgeschlossen' }, value: 'completed' },
        { label: { en: 'Archived', de: 'Archiviert' }, value: 'archived' },
      ],
    },
    {
      name: 'thema',
      type: 'select',
      hasMany: true,
      label: { en: 'Topics', de: 'Thema' },
      options: THEMA_OPTIONS.map((o) => ({ label: o.labelLocalized, value: o.value })),
    },
    {
      // Team catalog — the shared vocabulary the PM uses to tag members and
      // scope TEAM-visibility content (see project-memberships.teams and the
      // visibilityTeams field on content collections).
      name: 'teams',
      type: 'text',
      hasMany: true,
      label: { en: 'Teams', de: 'Teams' },
      admin: {
        description: {
          en: 'Team catalog for scoping content and members (e.g. Kernteam, Lenkungsgruppe).',
          de: 'Team-Katalog zum Scopen von Inhalten und Mitgliedern (z. B. Kernteam, Lenkungsgruppe).',
        },
      },
    },
    { name: 'startYear', type: 'number', label: { en: 'Start year', de: 'Startjahr' } },
    {
      name: 'modules',
      type: 'select',
      hasMany: true,
      label: { en: 'Modules', de: 'Module' },
      defaultValue: ['news', 'calendar'],
      options: [
        { label: { en: 'News', de: 'News' }, value: 'news' },
        { label: { en: 'Calendar', de: 'Kalender' }, value: 'calendar' },
        { label: { en: 'Polls', de: 'Umfragen' }, value: 'polls' },
        { label: { en: 'Forum', de: 'Forum' }, value: 'forum' },
        { label: { en: 'Tasks', de: 'Aufgaben' }, value: 'tasks' },
        { label: { en: 'Chat', de: 'Chat' }, value: 'chat' },
        { label: { en: 'Board', de: 'Board' }, value: 'board' },
        { label: { en: 'Files', de: 'Dateien' }, value: 'files' },
        { label: { en: 'Urban Agent', de: 'Urban Agent' }, value: 'urban-agent' },
      ],
    },
    {
      name: 'projektbeschreibung',
      type: 'richText',
      label: { en: 'Project description', de: 'Projektbeschreibung' },
      defaultValue: projectDefaults.projektbeschreibung,
    },
    {
      name: 'beteiligungsvorhaben',
      type: 'richText',
      label: { en: 'Participation intent', de: 'Beteiligungsvorhaben' },
    },
    {
      name: 'altersgruppe',
      type: 'select',
      hasMany: true,
      label: { en: 'Age groups', de: 'Altersgruppe' },
      defaultValue: projectDefaults.altersgruppe,
      options: ALTERSGRUPPE_OPTIONS.map((o) => ({ label: o.labelLocalized, value: o.value })),
    },
    {
      name: 'gender',
      type: 'select',
      hasMany: true,
      label: { en: 'Target groups', de: 'Zielgruppe' },
      defaultValue: projectDefaults.gender,
      options: GENDER_OPTIONS.map((o) => ({ label: o.labelLocalized, value: o.value })),
    },
    {
      name: 'ansprechperson',
      type: 'relationship',
      relationTo: 'users',
      label: { en: 'Contact person', de: 'Ansprechperson' },
    },
    {
      name: 'kontakt',
      type: 'group',
      label: { en: 'Contact', de: 'Kontakt' },
      fields: [
        { name: 'email', type: 'email', label: { en: 'Email', de: 'E-Mail' } },
        { name: 'telefon', type: 'text', label: { en: 'Phone', de: 'Telefon' } },
        { name: 'website', type: 'text', label: { en: 'Website', de: 'Website' } },
      ],
    },
    {
      name: 'members',
      type: 'join',
      collection: 'project-memberships',
      on: 'project',
      label: { en: 'Members', de: 'Mitglieder' },
    },
    {
      name: 'stadtbereich',
      type: 'select',
      hasMany: true,
      label: { en: 'City districts', de: 'Stadtbereich' },
      options: STADTBEREICH_OPTIONS.map((o) => ({ label: o.labelLocalized, value: o.value })),
    },
  ],
}
