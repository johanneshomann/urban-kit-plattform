// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'

export type PrototypeNotice = {
  enabled: boolean
  /** Admin-provided override text; null → the component uses the bundled default. */
  text: string | null
}

/**
 * Reads the prototype-notice settings from platform-settings. Fails closed:
 * any fetch error disables the notice rather than blocking the layout.
 */
export async function getPrototypeNotice(locale: string): Promise<PrototypeNotice> {
  try {
    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({
      slug: 'platform-settings',
      depth: 0,
      locale: locale as 'de' | 'en',
      fallbackLocale: 'de',
      overrideAccess: true,
    })) as { prototypeNoticeEnabled?: boolean | null; prototypeNoticeText?: string | null }
    const text = settings.prototypeNoticeText?.trim()
    return {
      enabled: Boolean(settings.prototypeNoticeEnabled),
      text: text ? text : null,
    }
  } catch {
    return { enabled: false, text: null }
  }
}
