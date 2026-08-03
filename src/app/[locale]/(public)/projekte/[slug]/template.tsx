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

    // Deeper navigation: the PREVIOUS page is about to unmount. Its cleanup
    // below captures the still-visible scroll position BEFORE the new page
    // paints — capturing in the new mount would already read 0.
    if (prev && sameProject(prev, pathname) && depth(pathname) > depth(prev)) {
      return () => {
        // Cleanup still runs with the old page on screen → correct window.scrollY.
        scrollByPath.set(prev, window.scrollY)
      }
    }

    // Back navigation: scroll to the remembered position once the new page has
    // painted. A single rAF can fire before the story sections (100svh) have
    // laid out, clamping to top — so we defer twice and fall back with a timer.
    if (sameProject(prev ?? '', pathname) && scrollByPath.has(pathname)) {
      const target = scrollByPath.get(pathname) ?? 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, target)
          // Safety net: if the page grew after layout, restore again shortly after.
          setTimeout(() => window.scrollTo(0, target), 60)
        })
      })
    }
  }, [pathname])

  const same = lastPath && sameProject(lastPath, pathname)
  const goingDeeper = same && depth(pathname) > depth(lastPath)
  const directionClass = goingDeeper ? 'animate-slide-left' : 'animate-slide-right'

  return <div key={pathname} className={same ? directionClass : ''}>{children}</div>
}