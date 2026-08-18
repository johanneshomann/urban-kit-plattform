// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
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
  // Migration: accounts created BEFORE email verification existed have no
  // `_verified` field — but Payload's JWT strategy requires it to be truthy
  // once auth.verify is on, which would silently log those users out on
  // every request (login works, every page bounces). Grandfather them in.
  // Idempotent: only touches docs where the field is missing.
  onInit: async (payload) => {
    try {
      await payload.db.collections.users?.updateMany(
        { _verified: { $exists: false } },
        { $set: { _verified: true } },
      )
    } catch (err) {
      payload.logger.error({ err, msg: 'Failed to grandfather pre-verification users' })
    }
  },
  // Transactional mail (account activation, password reset). Only wired when
  // SMTP is configured — without it Payload logs emails to the console and
  // email verification stays off (see Users.ts / src/lib/email.ts).
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM ?? 'noreply@urbankit.de',
          defaultFromName: 'UrbanKIT',
          // No boot-time transport probe — a sleeping dev mailcatcher would
          // log an error on every request; send failures still surface.
          skipVerify: true,
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            ...(process.env.SMTP_USER
              ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
              : {}),
          },
        }),
      }
    : {}),
})
