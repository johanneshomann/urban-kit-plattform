'use client'

import { useEffect } from 'react'

export interface SchemeVars {
  light: string
  mid: string
  dark: string
  accent: string
  white: string
  black: string
}

/**
 * Lifts the project colour scheme onto <html> while a project subtree is
 * mounted, so chrome rendered OUTSIDE the [slug] wrapper (the platform
 * header) can adopt it via `var(--project-*, fallback)`. Cleans up on
 * unmount → the header transitions back to platform colours.
 */
export function ProjectThemeScope({ scheme }: { scheme: SchemeVars }) {
  useEffect(() => {
    const root = document.documentElement
    const vars: Record<string, string> = {
      '--project-light': scheme.light,
      '--project-mid': scheme.mid,
      '--project-dark': scheme.dark,
      '--project-accent': scheme.accent,
      '--project-white': scheme.white,
      '--project-black': scheme.black,
    }
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
    return () => {
      for (const k of Object.keys(vars)) root.style.removeProperty(k)
    }
  }, [scheme])

  return null
}
