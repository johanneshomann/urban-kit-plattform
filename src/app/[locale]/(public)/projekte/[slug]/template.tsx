'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// Module-level state survives `template` remounts across client navigations,
// so a freshly mounted template can still know the *previous* path. A ref or
// component state would reset to the current path on every remount, making the
// depth comparison always "equal" (→ wrong direction).
let lastPath = ''

const depth = (p: string) => p.split('/').filter(Boolean).length

/**
 * Full-page slide transition wrapper for project sub-pages. On client
 * navigation the new template mount compares its path depth against the
 * previous page (stored in module scope): deeper → slide in from the right,
 * shallower → slide in from the left. Initial full page loads render without
 * animation (lastPath empty).
 */
export default function ProjectTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    lastPath = pathname
  }, [pathname])

  const prevDepth = lastPath ? depth(lastPath) : depth(pathname)
  const goingDeeper = depth(pathname) > prevDepth
  const directionClass = goingDeeper ? 'animate-slide-left' : 'animate-slide-right'

  return <div className={lastPath ? directionClass : ''}>{children}</div>
}