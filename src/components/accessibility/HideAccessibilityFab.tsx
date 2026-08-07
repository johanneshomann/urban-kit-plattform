'use client'

import { useEffect } from 'react'

/**
 * Hides the global floating accessibility FAB while mounted — the platform
 * area surfaces the same settings via the top bar's AccessibilityMenu instead.
 * Mounted once in dashboard/layout.tsx, so it covers the dashboard and every
 * project workspace; the FAB reappears on the public portal.
 */
export function HideAccessibilityFab() {
  useEffect(() => {
    document.documentElement.classList.add('a11y-fab-hidden')
    return () => document.documentElement.classList.remove('a11y-fab-hidden')
  }, [])
  return null
}
