'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// Module-level state survives `template` remounts across client navigations,
// so a freshly mounted template can still know the *previous* path. A ref or
// component state would reset to the current path on every remount, making the
// depth comparison always "equal" (→ wrong direction).
let lastPath = ''

// Scroll position captured per path before we leave for a deeper page, then
// restored on back-navigation — mirrors the browser's native scroll memory
// that Next's client navigation doesn't preserve for custom stacks.
const scrollByPath = new Map<string, number>()

const depth = (p: string) => p.split('/').filter(Boolean).length
const projectPrefix = (p: string) => p.split('/').slice(0, 4).join('/')
const sameProject = (a: string, b: string) => projectPrefix(a) === projectPrefix(b)

/**
 * Full-page slide transition wrapper for project sub-pages. On client
 * navigation the new template mount compares its path depth against the
 * previous page (stored in module scope), only sliding when the previous page
 * was *inside the same project* — deeper → slide in from the right, shallower
 * → slide in from the left. Scroll position is remembered per path and restored
 * on back-navigation. First visits into the project render without animation.
 */
export default function ProjectTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    const prev = lastPath
    lastPath = pathname

    // Leaving the current page for a deeper one: remember where we were so back
    // navigation can restore it. When arriving from a shallower page, scroll to
    // the remembered position once the new content is mounted.
    if (prev && sameProject(prev, pathname)) {
      if (depth(pathname) > depth(prev)) {
        scrollByPath.set(prev, window.scrollY)
      } else if (scrollByPath.has(pathname)) {
        // Defer to next frame so the slide animation has its start state.
        requestAnimationFrame(() => window.scrollTo(0, scrollByPath.get(pathname) ?? 0))
      }
    }
  }, [pathname])

  const same = lastPath && sameProject(lastPath, pathname)
  const goingDeeper = same && depth(pathname) > depth(lastPath)
  const directionClass = goingDeeper ? 'animate-slide-left' : 'animate-slide-right'

  return <div className={same ? directionClass : ''}>{children}</div>
}