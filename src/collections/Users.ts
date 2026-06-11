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
  ],
}
