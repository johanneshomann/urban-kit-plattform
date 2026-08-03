'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Full-page slide transition wrapper for project sub-pages.
 * Detects navigation direction (deeper → slide from right, shallower →
 * slide from left) by comparing path segment count, then applies the
 * appropriate CSS animation class. Renders on every navigation via Next.js
 * template semantics — children remount, this wrapper re-renders.
 */
export default function ProjectTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const prevDepth = useRef(segments(pathname))

  useEffect(() => {
    prevDepth.current = segments(pathname)
  }, [pathname])

  const depth = segments(pathname)
  const goingDeeper = depth > prevDepth.current
  const directionClass = goingDeeper ? 'animate-slide-left' : 'animate-slide-right'

  return <div className={directionClass}>{children}</div>
}

function segments(p: string): number {
  return p.split('/').filter(Boolean).length
}