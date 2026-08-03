'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// Module-level state survives `template` remounts across client navigations.
let lastPath = ''
let manualScrollInstalled = false

// Scroll position captured per path before leaving, restored on back-navigation.
const scrollByPath = new Map<string, number>()

const depth = (p: string) => p.split('/').filter(Boolean).length
const projectPrefix = (p: string) => p.split('/').slice(0, 4).join('/')
const sameProject = (a: string, b: string) => projectPrefix(a) === projectPrefix(b)

/**
 * Full-page slide transition wrapper for project sub-pages, plus custom scroll
 * memory. Capturing happens in a `popstate` listener (fires BEFORE the browser
 * swaps the route, so window.scrollY is still the leaving page's) and in the
 * previous template's cleanup (fallback for in-app link hops). Restoration
 * retries a few times because Next streams the new page in late.
 */
export default function ProjectTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (!manualScrollInstalled) {
      // Disable browser-native restoration so the custom memory is the only
      // thing that moves the page on back/forward.
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
      manualScrollInstalled = true
    }

    const prev = lastPath

    // popstate fires when the URL changes but BEFORE React renders the new
    // route → window.scrollY is still the page we are leaving.
    const onPop = () => {
      const next = window.location.pathname
      if (prev && sameProject(prev, next)) scrollByPath.set(prev, window.scrollY)
    }
    window.addEventListener('popstate', onPop)

    // Going deeper via in-app links: the upcoming path is `pathname`, the
    // leaving page is `prev`. Its cleanup may already see 0 (DOM swapped) →
    // only store when the value is plausible.
    if (prev && sameProject(prev, pathname) && depth(pathname) > depth(prev)) {
      return () => {
        if (window.scrollY > 0) scrollByPath.set(prev, window.scrollY)
        window.removeEventListener('popstate', onPop)
      }
    }

    // Back navigation (browser or in-app): restore the saved position once the
    // new page is actually painted — content streams in, so retry a few times.
    if (sameProject(prev ?? '', pathname) && scrollByPath.has(pathname)) {
      const target = scrollByPath.get(pathname) ?? 0
      const restore = () => {
        if (window.location.pathname === pathname) window.scrollTo(0, target)
      }
      requestAnimationFrame(() => requestAnimationFrame(restore))
      ;[80, 200, 500].forEach((ms) => setTimeout(restore, ms))
    }

    lastPath = pathname
    return () => window.removeEventListener('popstate', onPop)
  }, [pathname])

  const same = lastPath && sameProject(lastPath, pathname)
  const goingDeeper = same && depth(pathname) > depth(lastPath)
  const directionClass = goingDeeper ? 'animate-slide-left' : 'animate-slide-right'

  // key={pathname} remounts the wrapper per navigation so CSS slide animations
  // always restart (an unchanged animation-name never re-triggers).
  return <div key={pathname} className={same ? directionClass : ''}>{children}</div>
}