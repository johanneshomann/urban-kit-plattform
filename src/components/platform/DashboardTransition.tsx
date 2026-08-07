'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Navigate with the dashboard's exit animation: the current page slides out to
 * the left, then the route changes (which plays the matching enter animation).
 * Falls back to an instant navigation under reduced motion. No-op context
 * default so links outside DashboardTransition still work.
 */
const ExitContext = createContext<((href: string) => void) | null>(null)

export function useDashboardExit() {
  return useContext(ExitContext)
}

/** Guard for plain left-clicks — modified clicks keep native link behavior. */
export function isPlainLeftClick(e: React.MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented
}

const EXIT_MS = 320

/**
 * Wraps the dashboard content area and animates route changes with a
 * horizontal slide:
 *
 *  - Dashboard → project workspace / manage: the current page first slides out
 *    to the left (via `useDashboardExit`), then the new page slides in from
 *    the right (`animate-slide-left`).
 *  - Project → dashboard (back): the dashboard slides in from the left
 *    (`animate-slide-right`).
 *  - Same-depth navigations (e.g. workspace ↔ manage within one project):
 *    no horizontal slide — the workspace template's `card-in` handles it.
 *
 * Pure presentation: the App Router does all data fetching. The wrapper's
 * `key` forces a remount on each navigation so the CSS animation replays.
 * Uses the `animate-slide-*` keyframes in globals.css, which honor
 * `prefers-reduced-motion` and the a11y reduce-motion toggle.
 */
export function DashboardTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const prevPath = useRef(pathname)
  const [animClass, setAnimClass] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const [exiting, setExiting] = useState(false)

  /** Strip the locale prefix (e.g. `/de/dashboard` → `/dashboard`). */
  function stripLocale(p: string): string {
    return p.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/'
  }

  const navigateWithExit = useCallback(
    (href: string) => {
      const reduceMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.classList.contains('a11y-reduce-motion')
      if (reduceMotion) {
        router.push(href)
        return
      }
      setExiting(true)
      window.setTimeout(() => router.push(href), EXIT_MS)
    },
    [router],
  )

  useEffect(() => {
    const prev = stripLocale(prevPath.current)
    const curr = stripLocale(pathname)
    if (prev === curr) return

    setExiting(false)

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
    <ExitContext.Provider value={navigateWithExit}>
      <div className="overflow-hidden flex-1 min-w-0">
        <div key={animKey} className={exiting ? 'animate-slide-out-left' : (animClass ?? undefined)}>
          {children}
        </div>
      </div>
    </ExitContext.Provider>
  )
}
