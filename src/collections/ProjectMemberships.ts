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
        { label: { en: 'Follower', de: 'Follower' }, value: 'Follower' },
      ],
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
      // Part of the project's working team — grants access to TEAM-visibility
      // content (e.g. the Aufgaben board). PMs are always team members.
      name: 'isTeam',
      type: 'checkbox',
      label: { en: 'Team member', de: 'Teammitglied' },
      defaultValue: false,
    },
    {
      name: 'moduleOrder',
      type: 'json',
      admin: { hidden: true },
    },
  ],
}
