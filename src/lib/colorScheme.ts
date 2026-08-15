// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { defaultColorSchemes, type ColorScheme } from '@/lib/defaults/colorSchemes'
import { projectDefaults } from '@/lib/defaults/project'

/**
 * Resolve a project's stored colour-scheme name to its full palette.
 * Falls back to the project default scheme, then to the first scheme,
 * so the return value is always a valid {@link ColorScheme}.
 *
 * Pass `schemes` (from `getColorSchemes()` in color-schemes-store.ts) to
 * resolve against the admin-edited palettes; without it the code defaults
 * apply — client components receive the effective list via props.
 */
export function resolveColorScheme(name?: string | null, schemes: readonly ColorScheme[] = defaultColorSchemes): ColorScheme {
  return (
    schemes.find((s) => s.name === (name ?? projectDefaults.colorScheme)) ??
    schemes[0] ??
    defaultColorSchemes[0]!
  )
}

/**
 * Map a palette onto the `--project-*` CSS custom properties consumed by the
 * project dashboard and its module subpages (via `var(--project-*)`).
 *
 * The single source of this mapping — `ProjectThemeScope` writes the same vars
 * onto `<html>` and reads them from here rather than repeating the list.
 */
export function schemeToCssVars(scheme: ColorScheme): Record<string, string> {
  return {
    '--project-light':   scheme.light,
    '--project-general': scheme.general,
    '--project-dark':    scheme.dark,
    '--project-accent':  scheme.accent,
    '--project-ink':     scheme.ink,
    '--project-white':   scheme.white,
    '--project-black':   scheme.black,
  }
}
