'use client'

import { useEffect } from 'react'

/**
 * Lifts a Bereich accent onto <html> while a Bereich page is mounted, so
 * global chrome rendered outside the page tree (e.g. the floating
 * accessibility button) can adopt it via `var(--bereich-accent, fallback)`.
 * Cleans up on unmount → the chrome falls back to platform colors.
 */
export function BereichThemeScope({ accent }: { accent: string }) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bereich-accent', accent)
    return () => {
      root.style.removeProperty('--bereich-accent')
    }
  }, [accent])

  return null
}
