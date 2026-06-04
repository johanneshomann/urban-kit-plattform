import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'

export const ColorSchemes: CollectionConfig = {
  slug: 'color-schemes',
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'primary',
      type: 'text',
      required: true,
      admin: { description: 'CSS color value e.g. hsl(221 83% 53%)' },
    },
    {
      name: 'primaryForeground',
      type: 'text',
      required: true,
    },
    {
      name: 'accent',
      type: 'text',
      required: true,
    },
    {
      name: 'accentForeground',
      type: 'text',
      required: true,
    },
  ],
}
