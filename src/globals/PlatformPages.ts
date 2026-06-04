import type { GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { isAdmin } from '@/lib/access'

export const PlatformPages: GlobalConfig = {
  slug: 'platform-pages',
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'grundlagen',
      type: 'richText',
      editor: lexicalEditor(),
    },
    {
      name: 'zusammenarbeit',
      type: 'richText',
      editor: lexicalEditor(),
    },
    {
      name: 'mitmachen',
      type: 'richText',
      editor: lexicalEditor(),
    },
    {
      name: 'impressum',
      type: 'richText',
      editor: lexicalEditor(),
    },
  ],
}
