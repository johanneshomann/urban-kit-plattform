'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// Module-level state survives `template` remounts across client navigations,
// so a freshly mounted template can still know the *previous* path. A ref or
// component state would reset to the current path on every remount, making the
// depth comparison always "equal" (→ wrong direction).
let lastPath = ''

const depth = (p: string) => p.split('/').filter(Boolean).length
const projectPrefix = (p: string) => p.split('/').slice(0, 4).join('/')

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

  // Only animate between pages *inside the same project stack* — entering from
  // the landing page or another project must not slide. First load: no lastPath.
  const sameProject = lastPath ? projectPrefix(lastPath) === projectPrefix(pathname) : false
  const goingDeeper = sameProject && depth(pathname) > depth(lastPath)
  const directionClass = goingDeeper ? 'animate-slide-left' : 'animate-slide-right'

  return <div className={sameProject ? directionClass : ''}>{children}</div>
}
