// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { de } from '@payloadcms/translations/languages/de'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { ProjectMemberships } from './collections/ProjectMemberships'
import { Activity } from './collections/Activity'
import { Notifications } from './collections/Notifications'
import { PlatformSettings } from './globals/PlatformSettings'
import { LegalSettings } from './globals/LegalSettings'
import { UrbanAgentSettings } from './globals/UrbanAgentSettings'
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
  // Admin UI language: German-first, English available. Pins the admin panel
  // to these two languages instead of Payload's full auto-detected set.
  i18n: {
    supportedLanguages: { de, en },
    fallbackLanguage: 'de',
  },
  // Content localization. Only fields explicitly marked `localized: true` are
  // stored per-locale — today that is the legal texts global (LegalSettings),
  // single fields on PlatformSettings/UrbanAgentSettings. All project content
  // stays single-value and language-agnostic (no `localized` flag).
  localization: {
    locales: [
      { label: 'Deutsch', code: 'de' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'de',
    fallback: true,
  },
  collections: [
    Users,
    Media,
    Projects,
    ProjectMemberships,
    Activity,
    Notifications,
  ],
  globals: [PlatformSettings, LegalSettings, UrbanAgentSettings],
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
