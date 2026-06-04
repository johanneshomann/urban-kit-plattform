import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { ColorSchemes } from './collections/ColorSchemes'
import { Projects } from './collections/Projects'
import { Teams } from './collections/Teams'
import { ProjectMemberships } from './collections/ProjectMemberships'
import { ContentManagerAssignments } from './collections/ContentManagerAssignments'
import { ProjectModules } from './collections/ProjectModules'
import { Activity } from './collections/Activity'
import { Notifications } from './collections/Notifications'
import { PlatformSettings } from './globals/PlatformSettings'
import { PlatformPages } from './globals/PlatformPages'
import { LegalSettings } from './globals/LegalSettings'
import { moduleRegistry } from './modules/registry'
import './modules/index' // registers all module plugins

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    ColorSchemes,
    Projects,
    Teams,
    ProjectMemberships,
    ContentManagerAssignments,
    ProjectModules,
    Activity,
    Notifications,
  ],
  globals: [PlatformSettings, PlatformPages, LegalSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret-change-me',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI ?? '',
  }),
  plugins: moduleRegistry.plugins(),
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
})
