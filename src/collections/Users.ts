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
    {
      name: 'role',
      type: 'select',
      defaultValue: 'citizen',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Citizen', value: 'citizen' },
        { label: 'Project Manager', value: 'project-manager' },
        { label: 'Team Manager', value: 'team-manager' },
      ],
    },
  ],
}
