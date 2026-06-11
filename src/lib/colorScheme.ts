import { defaultColorSchemes, type ColorScheme } from '@/lib/defaults/colorSchemes'
import { projectDefaults } from '@/lib/defaults/project'

/**
 * Resolve a project's stored colour-scheme name to its full palette.
 * Falls back to the project default scheme, then to the first scheme,
 * so the return value is always a valid {@link ColorScheme}.
 */
export function resolveColorScheme(name?: string | null): ColorScheme {
  return (
    defaultColorSchemes.find((s) => s.name === (name ?? projectDefaults.colorScheme)) ??
    defaultColorSchemes[0]!
  )
}

/**
 * Map a palette onto the `--project-*` CSS custom properties consumed by the
 * project dashboard and its module subpages (via `var(--project-*)`).
 */
export function schemeToCssVars(scheme: ColorScheme): Record<string, string> {
  return {
    '--project-light':  scheme.light,
    '--project-mid':    scheme.mid,
    '--project-dark':   scheme.dark,
    '--project-accent': scheme.accent,
    '--project-white':  scheme.white,
    '--project-black':  scheme.black,
  }
}
