// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'

import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { defaultColorSchemes, type ColorScheme } from '@/lib/defaults/colorSchemes'

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const ROLES = ['light', 'general', 'dark', 'accent', 'ink', 'white', 'black'] as const

/**
 * The effective project color schemes: the admin-editable `schemes` rows on
 * the platform-settings global (Projektfarben tab) merged over the code
 * defaults, matched by scheme name. Invalid or missing values fall back per
 * role, so the result is always eight complete, valid palettes. Cached per
 * request.
 */
export const getColorSchemes = cache(async (): Promise<ColorScheme[]> => {
  try {
    const payload = await getPayload({ config })
    const global = (await payload.findGlobal({ slug: 'platform-settings', depth: 0, overrideAccess: true })) as {
      schemes?: ({ name?: string | null } & Partial<Record<(typeof ROLES)[number], string | null>>)[] | null
    }
    const rows = global.schemes ?? []
    return defaultColorSchemes.map((def) => {
      const row = rows.find((r) => r.name === def.name)
      if (!row) return def
      const merged: ColorScheme = { ...def }
      for (const role of ROLES) {
        const value = row[role]
        if (typeof value === 'string' && HEX_RE.test(value)) merged[role] = value
      }
      return merged
    })
  } catch {
    return [...defaultColorSchemes]
  }
})
