import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/lib/access'

export const ProjectMemberships: CollectionConfig = {
  slug: 'project-memberships',
  labels: {
    singular: { en: 'Project membership', de: 'Projektmitgliedschaft' },
    plural: { en: 'Project memberships', de: 'Projektmitgliedschaften' },
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: { en: 'User', de: 'Benutzer:in' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, label: { en: 'Project', de: 'Projekt' } },
    {
      name: 'role',
      type: 'select',
      label: { en: 'Role', de: 'Rolle' },
      required: true,
      options: [
        { label: { en: 'Project manager', de: 'Projektmanager' }, value: 'PM' },
        { label: { en: 'Citizen', de: 'Bürger:in' }, value: 'Citizen' },
      ],
    },
    {
      name: 'starred',
      type: 'checkbox',
      label: { en: 'Starred', de: 'Favorit' },
      defaultValue: false,
    },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', de: 'Status' },
      defaultValue: 'active',
      options: [
        { label: { en: 'Requested', de: 'Angefragt' }, value: 'requested' },
        { label: { en: 'Active', de: 'Aktiv' }, value: 'active' },
        { label: { en: 'Rejected', de: 'Abgelehnt' }, value: 'rejected' },
      ],
    },
    {
      // Team tags (from the project's `teams` catalog). A membership tagged
      // with a team can see TEAM-visibility content scoped to that team.
      name: 'teams',
      type: 'text',
      hasMany: true,
      label: { en: 'Teams', de: 'Teams' },
      admin: {
        description: {
          en: 'Team tags this member belongs to (must match the project team catalog).',
          de: 'Team-Tags, zu denen diese Person gehört (müssen dem Projekt-Team-Katalog entsprechen).',
        },
      },
    },
    {
      name: 'moduleOrder',
      type: 'json',
      admin: { hidden: true },
    },
  ],
}
