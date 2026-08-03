'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type DotItem = {
  id: string
  label: string
  icon?: string
  /** Idle dot color; defaults to the rail's `dotColor`. */
  dotColor?: string
  /** Active dot + label-bubble color; defaults to the rail's `activeColor`. */
  activeColor?: string
}

/** A route link rendered as a ring dot below the section dots (Bereich subpages etc.). */
export type PageDot = {
  href: string
  label: string
  icon?: string
  external?: boolean
}

/** A Bereich link revealed by the switcher: its hero icon in its own color. */
export type SwitchPage = {
  href: string
  label: string
  icon: string
  color: string
}

interface SectionDotsNavProps {
  items: DotItem[]
  label: string
  /** When set, the rail stays hidden while this element (e.g. the hero) is in the viewport. */
  appearAfterId?: string
  /** Route links shown as ring dots below a divider — navigation across the Bereich's pages. */
  pages?: PageDot[]
  /**
   * Bereich switcher on top of the rail: a switch icon (in the rail's active
   * color) that expands to reveal the other Bereich pages as icon links.
   */
  switchPages?: SwitchPage[]
  /** Rail-wide idle dot color; defaults to `--plattform`. */
  dotColor?: string
  /** Rail-wide active/bubble color; defaults to `--plattform-accent`. */
  activeColor?: string
}

/**
 * Fixed right-side dot rail. Two zones:
 * - Section dots (filled): track scroll via IntersectionObserver and highlight
 *   the most-visible section; hovering (or briefly after a change) reveals a
 *   label bubble.
 * - Page dots (rings, below a divider): route links to the sibling pages of the
 *   current Bereich; the current page renders filled.
 * Desktop-only by design (hidden below `md`).
 */
export function SectionDotsNav({ items, label, appearAfterId, pages = [], switchPages = [], dotColor, activeColor }: SectionDotsNavProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [visible, setVisible] = useState(!appearAfterId)
  const prevActive = useRef<string | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const railDot = dotColor ?? 'var(--plattform)'
  const railActive = activeColor ?? 'var(--plattform-accent)'
  // Section dots only make sense in twos; the pages zone can stand alone.
  const showSections = items.length >= 2

  useEffect(() => {
    if (!appearAfterId) return
    const el = document.getElementById(appearAfterId)
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [appearAfterId])

  useEffect(() => {
    if (!showSections) return
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        // Keep a running record of every section's latest visibility, then pick
        // whichever is most in view — not just the ones in this batch.
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
  }, [items, showSections])

  if (!showSections && pages.length === 0 && switchPages.length === 0) return null

  const bubble = (key: string, text: string, Icon: LucideIcon | null, color: string, shown: boolean) => (
    <span
      className="absolute right-full mr-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-small whitespace-nowrap px-2.5 py-1 rounded-lg pointer-events-none"
      style={{
        background: color,
        color: 'var(--plattform-white)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateX(0)' : 'translateX(6px)',
        transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {Icon && <Icon className="w-[1em] h-[1em] shrink-0" aria-hidden />}
      {text}
    </span>
  )

  return (
    <nav
      aria-label={label}
      aria-hidden={!visible}
      className="fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-1 items-end"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? undefined : 'none',
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Bereich switcher — reveals the other Bereich pages as icon links */}
      {switchPages.length > 0 && (
        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={() => setSwitchOpen((v) => !v)}
            aria-expanded={switchOpen}
            aria-label={label}
            className="relative flex items-center justify-center p-2 cursor-pointer"
          >
            {(() => {
              const SwitchIcon = (LucideIcons as unknown as Record<string, LucideIcon>)['ArrowLeftRight']
              return (
                <SwitchIcon
                  className={`w-4 h-4 transition-transform duration-300 ${switchOpen ? 'rotate-180' : ''}`}
                  style={{ color: railActive }}
                />
              )
            })()}
          </button>
          <div className={`grid transition-all duration-300 ease-in-out ${switchOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden flex flex-col items-end">
              {switchPages.map((page) => {
                const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[page.icon] ?? null
                const showLabel = hoveredId === page.href
                return (
                  <Link
                    key={page.href}
                    href={page.href}
                    aria-label={page.label}
                    onMouseEnter={() => setHoveredId(page.href)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="relative flex items-center justify-center p-2 group"
                  >
                    {bubble(page.href, page.label, null, page.color, showLabel)}
                    {Icon && (
                      <Icon
                        className="w-4 h-4 transition-transform duration-200"
                        style={{ color: page.color, transform: hoveredId === page.href ? 'scale(1.2)' : 'scale(1)' }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
          {(showSections || pages.length > 0) && (
            <span aria-hidden className="flex items-center justify-center px-2 py-1 self-end">
              <span className="block h-px w-3" style={{ background: railDot, opacity: 0.5 }} />
            </span>
          )}
        </div>
      )}

      {showSections && items.map((item) => {
        const isActive = activeId === item.id
        const showLabel = hoveredId === item.id || revealId === item.id
        const Icon = item.icon ? (LucideIcons as unknown as Record<string, LucideIcon>)[item.icon] ?? null : null
        const idle = item.dotColor ?? railDot
        const active = item.activeColor ?? railActive

        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-label={item.label}
            aria-current={isActive ? 'true' : undefined}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative flex items-center justify-center p-2 group"
          >
            {bubble(item.id, item.label, Icon, active, showLabel)}
            {/* Dot */}
            <span
              aria-hidden
              className="block rounded-full"
              style={{
                background: isActive ? active : idle,
                width: isActive ? 14 : 10,
                height: isActive ? 14 : 10,
                transform: !isActive && hoveredId === item.id ? 'scale(1.3)' : 'scale(1)',
                transition: 'width 0.25s, height 0.25s, transform 0.2s, background 0.25s',
              }}
            />
          </a>
        )
      })}

      {/* Divider between section dots and page links */}
      {showSections && pages.length > 0 && (
        <span aria-hidden className="flex items-center justify-center px-2 py-1">
          <span className="block h-px w-3" style={{ background: railDot, opacity: 0.5 }} />
        </span>
      )}

      {pages.map((page) => {
        const isCurrent = pathname === page.href
        const showLabel = hoveredId === page.href
        const Icon = page.icon ? (LucideIcons as unknown as Record<string, LucideIcon>)[page.icon] ?? null : null

        const dot = (
          <span
            aria-hidden
            className="block rounded-full box-border"
            style={{
              background: isCurrent ? railActive : 'transparent',
              border: isCurrent ? 'none' : `2px solid ${railDot}`,
              width: isCurrent ? 14 : 10,
              height: isCurrent ? 14 : 10,
              transform: !isCurrent && hoveredId === page.href ? 'scale(1.3)' : 'scale(1)',
              transition: 'width 0.25s, height 0.25s, transform 0.2s, background 0.25s',
            }}
          />
        )
        const common = {
          'aria-label': page.label,
          onMouseEnter: () => setHoveredId(page.href),
          onMouseLeave: () => setHoveredId(null),
          className: 'relative flex items-center justify-center p-2 group',
        }

        if (page.external) {
          return (
            <a key={page.href} href={page.href} target="_blank" rel="noopener noreferrer" {...common}>
              {bubble(page.href, page.label, Icon, railActive, showLabel)}
              {dot}
            </a>
          )
        }
        return (
          <Link key={page.href} href={page.href} aria-current={isCurrent ? 'page' : undefined} {...common}>
            {bubble(page.href, page.label, Icon, railActive, showLabel)}
            {dot}
          </Link>
        )
      })}
    </nav>
  )
}
