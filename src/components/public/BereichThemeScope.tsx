// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect } from 'react'

/**
 * Lifts a Bereich accent (+ its on-brand text color) onto <html> while a
 * Bereich page is mounted, so global chrome rendered outside the page tree
 * (e.g. the floating accessibility button) can adopt it via
 * `var(--bereich-accent, fallback)` / `var(--bereich-on-brand, fallback)`.
 * Cleans up on unmount → the chrome falls back to platform colors.
 */
export function BereichThemeScope({ accent, onBrand }: { accent: string; onBrand?: string }) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bereich-accent', accent)
    if (onBrand) root.style.setProperty('--bereich-on-brand', onBrand)
    return () => {
      root.style.removeProperty('--bereich-accent')
      root.style.removeProperty('--bereich-on-brand')
    }
  }, [accent, onBrand])

  return null
}
