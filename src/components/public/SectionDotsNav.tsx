'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type DotItem = {
  id: string
  label: string
  icon?: string
  /** Idle dot color; defaults to the rail's `dotColor`. */
  dotColor?: string
  /** Active dot + label-bubble color; defaults to the rail's `activeColor`. */
  activeColor?: string
}

/** A route link rendered as a ring dot below the section dots (Bereich subpages etc.). */
type PageDot = {
  href: string
  label: string
  icon?: string
  external?: boolean
}

/** A Bereich link revealed by the switcher: its hero icon on a chip-colored ball. */
type SwitchPage = {
  href: string
  label: string
  icon: string
  /** Ball background — the Bereich's dark (chip) color. */
  color: string
  /** Icon color on the ball; defaults to `--plattform-white` (projekte chips use ink). */
  iconColor?: string
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
  /** Icon color on the switch ball; defaults to `--plattform-white` (projekte chips use ink). */
  switchIconColor?: string
  /** Background of the switch ball; defaults to the rail's `activeColor`. */
  switchColor?: string
  /** Background of the label bubbles; defaults to the rail's `activeColor`. */
  bubbleColor?: string
  /** Text color of the label bubbles; defaults to `--plattform-white` (projekte chips use ink). */
  labelColor?: string
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
export function SectionDotsNav({ items, label, appearAfterId, pages = [], switchPages = [], switchIconColor, switchColor, bubbleColor, labelColor, dotColor, activeColor }: SectionDotsNavProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [revealId, setRevealId] = useState<string | null>(null)
  const [switchOpen, setSwitchOpen] = useState(false)
  // Overflow may only be released AFTER the open animation, so opening and
  // closing both show the same width slide; while animating (and closed) the
  // reveal stays clipped.
  const [switchSettled, setSwitchSettled] = useState(false)

  useEffect(() => {
    if (!switchOpen) {
      setSwitchSettled(false)
      return
    }
    const timer = setTimeout(() => setSwitchSettled(true), 300)
    return () => clearTimeout(timer)
  }, [switchOpen])
  const [visible, setVisible] = useState(!appearAfterId)
  const prevActive = useRef<string | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const railDot = dotColor ?? 'var(--plattform)'
  const railActive = activeColor ?? 'var(--plattform-accent)'
  const railBubble = bubbleColor ?? railActive
  const ballColor = switchColor ?? railActive
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
        color: labelColor ?? 'var(--plattform-white)',
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
    <>
      {/* Bereich switcher — fixed top right under the header, accessibility-button sizing;
          reveals all Bereiche horizontally to the left */}
      {switchPages.length > 0 && (
        <div
          inert={!visible}
          className="fixed top-[4.5rem] right-4 lg:right-6 z-40 hidden md:flex flex-row-reverse items-center justify-start"
          style={{
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? undefined : 'none',
            transition: 'opacity 0.4s ease',
          }}
        >
          <button
            type="button"
            onClick={() => setSwitchOpen((v) => !v)}
            aria-expanded={switchOpen}
            aria-controls="bereich-switcher-reveal"
            aria-label={label}
            className="relative flex items-center justify-center cursor-pointer group"
          >
            {(() => {
              const SwitchIcon = (LucideIcons as unknown as Record<string, LucideIcon>)['ArrowLeftRight']
              return (
                <span
                  className="flex items-center justify-center h-12 w-12 rounded-2xl shadow-md transition-transform duration-200 group-hover:scale-105"
                  style={{ background: ballColor }}
                >
                  <SwitchIcon
                    className={`h-6 w-6 transition-transform duration-300 ${switchOpen ? 'rotate-180' : ''}`}
                    style={{ color: switchIconColor ?? 'var(--plattform-white)' }}
                  />
                </span>
              )
            })()}
          </button>
          <div
            id="bereich-switcher-reveal"
            inert={!switchOpen}
            className="grid transition-all duration-300 ease-in-out"
            style={{ gridTemplateColumns: switchOpen ? '1fr' : '0fr' }}
          >
            {/* Clip while collapsed/animating — once settled open, let the hover bubbles escape */}
            <div className={switchSettled ? 'overflow-visible' : 'overflow-hidden'}>
              <div className={`flex items-center gap-2 py-3 pl-3 pr-2 transition-opacity duration-300 ${switchOpen ? 'opacity-100' : 'opacity-0'}`}>
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
                      onFocus={() => setHoveredId(page.href)}
                      onBlur={() => setHoveredId(null)}
                      className="relative flex items-center justify-center group"
                    >
                      {/* Label bubble below the ball (the row sits under the header) */}
                      <span
                        className="absolute top-full mt-1 left-1/2 -translate-x-1/2 inline-flex items-center text-small whitespace-nowrap px-2.5 py-1 rounded-lg pointer-events-none"
                        style={{
                          background: page.color,
                          color: page.iconColor ?? 'var(--plattform-white)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          opacity: showLabel ? 1 : 0,
                          transform: showLabel ? 'translate(-50%, 0)' : 'translate(-50%, -4px)',
                          transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)',
                        }}
                      >
                        {page.label}
                      </span>
                      <span
                        className="flex items-center justify-center h-12 w-12 rounded-2xl shadow-md transition-transform duration-200 group-hover:scale-105"
                        style={{ background: page.color }}
                      >
                        {Icon && <Icon className="h-6 w-6" style={{ color: page.iconColor ?? 'var(--plattform-white)' }} />}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

        </div>
      )}

    <nav
      aria-label={label}
      inert={!visible}
      className="fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-1 items-end"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? undefined : 'none',
        transition: 'opacity 0.4s ease',
      }}
    >
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
            onFocus={() => setHoveredId(item.id)}
            onBlur={() => setHoveredId(null)}
            className="relative flex items-center justify-center p-2 group"
          >
            {bubble(item.id, item.label, Icon, item.activeColor ?? railBubble, showLabel)}
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
          onFocus: () => setHoveredId(page.href),
          onBlur: () => setHoveredId(null),
          className: 'relative flex items-center justify-center p-2 group',
        }

        if (page.external) {
          return (
            <a key={page.href} href={page.href} target="_blank" rel="noopener noreferrer" {...common}>
              {bubble(page.href, page.label, Icon, railBubble, showLabel)}
              {dot}
            </a>
          )
        }
        return (
          <Link key={page.href} href={page.href} aria-current={isCurrent ? 'page' : undefined} {...common}>
            {bubble(page.href, page.label, Icon, railBubble, showLabel)}
            {dot}
          </Link>
        )
      })}
    </nav>
    </>
  )
}
