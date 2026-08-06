'use client'

import { useEffect } from 'react'
import { schemeToCssVars } from '@/lib/colorScheme'
import type { ColorScheme } from '@/lib/defaults/colorSchemes'

/**
 * Lifts the project colour scheme onto <html> while a project subtree is
 * mounted, so chrome rendered OUTSIDE the [slug] wrapper can adopt it via
 * `var(--project-*, fallback)` — today that is the PlatformDock, which lives in
 * `dashboard/layout.tsx`. Cleans up on unmount → the dock transitions back to
 * platform colours.
 *
 * The var list comes from `schemeToCssVars` so it cannot drift from the inline
 * styles the [slug] layout paints on its wrapper.
 */
export function ProjectThemeScope({ scheme }: { scheme: ColorScheme }) {
  useEffect(() => {
    const root = document.documentElement
    const vars = schemeToCssVars(scheme)
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
    return () => {
      for (const k of Object.keys(vars)) root.style.removeProperty(k)
    }
  }, [scheme])

  return null
}
