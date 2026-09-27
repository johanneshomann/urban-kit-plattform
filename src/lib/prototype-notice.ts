// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'

export type PrototypeNotice = {
  enabled: boolean
  /** Admin-provided override text; null → the component uses the bundled default. */
  text: string | null
  /** At least one demo account is configured — the notice may point to the login page. */
  hasDemoAccounts: boolean
}

export type DemoAccount = { label: string; email: string; password: string; description: string | null }

type PrototypeSettings = {
  prototypeNoticeEnabled?: boolean | null
  prototypeNoticeText?: string | null
  prototypeDemoAccounts?: Array<{ label?: string | null; email?: string | null; password?: string | null; description?: string | null }> | null
}

async function readSettings(locale: string): Promise<PrototypeSettings> {
  const payload = await getPayload({ config })
  return (await payload.findGlobal({
    slug: 'platform-settings',
    depth: 0,
    locale: locale as 'de' | 'en',
    fallbackLocale: 'de',
    overrideAccess: true,
  })) as PrototypeSettings
}

/**
 * Reads the prototype-notice settings from platform-settings. Fails closed:
 * any fetch error disables the notice rather than blocking the layout.
 */
export async function getPrototypeNotice(locale: string): Promise<PrototypeNotice> {
  try {
    const settings = await readSettings(locale)
    const text = settings.prototypeNoticeText?.trim()
    const enabled = Boolean(settings.prototypeNoticeEnabled)
    return {
      enabled,
      text: text ? text : null,
      hasDemoAccounts: enabled && (settings.prototypeDemoAccounts ?? []).some((a) => a?.email && a?.password),
    }
  } catch {
    return { enabled: false, text: null, hasDemoAccounts: false }
  }
}

/**
 * Demo accounts for the login page — only while the prototype notice is on,
 * and only entries whose user exists AND is flagged `isDemo` (so a typo can
 * never expose or one-click-log-into a real account). Fails closed.
 */
export async function getDemoAccounts(locale: string): Promise<DemoAccount[]> {
  try {
    const settings = await readSettings(locale)
    if (!settings.prototypeNoticeEnabled) return []
    const entries = (settings.prototypeDemoAccounts ?? []).filter((a) => a?.email && a?.password && a?.label)
    if (entries.length === 0) return []
    const payload = await getPayload({ config })
    const users = await payload.find({
      collection: 'users',
      where: { and: [{ email: { in: entries.map((a) => String(a.email).toLowerCase()) } }, { isDemo: { equals: true } }] },
      limit: entries.length,
      depth: 0,
      overrideAccess: true,
    })
    const demoEmails = new Set(users.docs.map((u) => String((u as { email: string }).email).toLowerCase()))
    return entries
      .filter((a) => demoEmails.has(String(a.email).toLowerCase()))
      .map((a) => ({
        label: String(a.label),
        email: String(a.email),
        password: String(a.password),
        description: a.description?.trim() || null,
      }))
  } catch {
    return []
  }
}
