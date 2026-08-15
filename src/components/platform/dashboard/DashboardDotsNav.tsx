// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef, useState } from 'react'

export type DashboardDotItem = { id: string; label: string }

/**
 * Fixed right-side dot rail for the dashboard — adapted from the public
 * Bereich rail (SectionDotsNav), reduced to its section-tracking core and
 * restyled with the app tokens: ink-mix idle dots, accent active dot, label
 * bubbles in the dashboard tooltip look (ink-accent on white). Desktop-only;
 * the page renders it only when more than two sections are visible.
 */
export function DashboardDotsNav({ items, label }: { items: DashboardDotItem[]; label: string }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [revealId, setRevealId] = useState<string | null>(null)
  const prevActive = useRef<string | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const ratios = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        // Track every section's latest visibility, then highlight whichever is
        // most in view — not just the ones in this batch.
        for (const e of entries) {
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0)
        }
        let bestId: string | null = null
        let bestRatio = 0
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }
        if (!bestId) return
        setActiveId(bestId)
        if (prevActive.current !== bestId) {
          prevActive.current = bestId
          setRevealId(bestId)
          if (revealTimer.current) clearTimeout(revealTimer.current)
          revealTimer.current = setTimeout(() => setRevealId(null), 1500)
        }
      },
      { rootMargin: '-30% 0px -30% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    sections.forEach((s) => observer.observe(s))
    return () => {
      observer.disconnect()
      if (revealTimer.current) clearTimeout(revealTimer.current)
    }
  }, [items])

  return (
    <nav
      aria-label={label}
      className="fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-1 items-end"
    >
      {items.map((item) => {
        const isActive = activeId === item.id
        const showLabel = hoveredId === item.id || revealId === item.id
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-label={item.label}
            aria-current={isActive ? 'true' : undefined}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(item.id)}
            onBlur={() => setHoveredId(null)}
            className="relative flex items-center justify-center p-2 group"
          >
            {/* Label bubble — dashboard tooltip look */}
            <span
              className="absolute right-full mr-1 top-1/2 -translate-y-1/2 inline-flex items-center text-small whitespace-nowrap px-2.5 py-1 rounded-lg shadow-md pointer-events-none"
              style={{
                background: 'var(--app-ink-accent)',
                color: 'var(--app-white)',
                opacity: showLabel ? 1 : 0,
                transform: showLabel ? 'translateX(0)' : 'translateX(6px)',
                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              {item.label}
            </span>
            <span
              aria-hidden
              className="block rounded-full"
              style={{
                background: isActive ? 'var(--app-accent)' : 'color-mix(in srgb, var(--app-ink) 25%, transparent)',
                width: isActive ? 14 : 10,
                height: isActive ? 14 : 10,
                transform: !isActive && hoveredId === item.id ? 'scale(1.3)' : 'scale(1)',
                transition: 'width 0.25s, height 0.25s, transform 0.2s, background 0.25s',
              }}
            />
          </a>
        )
      })}
    </nav>
  )
}
