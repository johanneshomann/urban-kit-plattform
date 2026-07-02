import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    {
      name: 'memberships',
      type: 'join',
      collection: 'project-memberships',
      on: 'user',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'user',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
    },
    {
      name: 'affiliations',
      type: 'select',
      hasMany: true,
      label: 'Hintergrund',
      options: [
        { label: 'Bürger:in', value: 'citizen' },
        { label: 'Student:in', value: 'student' },
        { label: 'Mitarbeiter:in der Stadt', value: 'cityEmployee' },
        { label: 'Hochschule / Forschung', value: 'academia' },
        { label: 'Sonstiges', value: 'other' },
      ],
    },
    {
      name: 'cityInfo',
      type: 'group',
      label: 'Angaben zur Stadt',
      admin: {
        condition: (data) => Array.isArray(data?.affiliations) && data.affiliations.includes('cityEmployee'),
      },
      fields: [
        { name: 'organization', type: 'text', label: 'Organisation' },
        { name: 'fachbereich', type: 'text', label: 'Fachbereich' },
        { name: 'position', type: 'text', label: 'Position / Funktion' },
      ],
    },
  ],
}
