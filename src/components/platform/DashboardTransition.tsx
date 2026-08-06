'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Wraps the dashboard content area and animates route changes with a
 * horizontal slide:
 *
 *  - Dashboard → project workspace / manage: content slides left, new page
 *    slides in from the right (`animate-slide-left`).
 *  - Project → dashboard (back): the dashboard slides in from the left
 *    (`animate-slide-right`).
 *  - Same-depth navigations (e.g. workspace ↔ manage within one project):
 *    no horizontal slide — the workspace template's `card-in` handles it.
 *
 * Pure presentation: the App Router does all data fetching. The wrapper's
 * `key` forces a remount on each navigation so the CSS animation replays.
 * Uses the existing `animate-slide-*` keyframes in globals.css, which honor
 * `prefers-reduced-motion` and the a11y reduce-motion toggle.
 */
export function DashboardTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const [animClass, setAnimClass] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)

  /** Strip the locale prefix (e.g. `/de/dashboard` → `/dashboard`). */
  function stripLocale(p: string): string {
    return p.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/'
  }

  useEffect(() => {
    const prev = stripLocale(prevPath.current)
    const curr = stripLocale(pathname)
    if (prev === curr) return

    // Entering a project from the dashboard → slide in from right
    const enteringProject = prev === '/dashboard' && curr.startsWith('/dashboard/projekte')

    // Returning to the dashboard from a project → slide in from left
    const returningToDashboard = prev.startsWith('/dashboard/projekte') && curr === '/dashboard'

    if (enteringProject) {
      setAnimClass('animate-slide-left')
      setAnimKey((k) => k + 1)
    } else if (returningToDashboard) {
      setAnimClass('animate-slide-right')
      setAnimKey((k) => k + 1)
    } else {
      // Same-depth (workspace ↔ manage) — no animation wrapper change
      setAnimClass(null)
    }

    prevPath.current = pathname
  }, [pathname])

  return (
    <div className="overflow-hidden flex-1 min-w-0">
      <div key={animKey} className={animClass ?? undefined}>
        {children}
      </div>
    </div>
  )
}