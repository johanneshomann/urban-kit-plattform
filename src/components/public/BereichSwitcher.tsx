'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import { Circle, FolderOpen, Layout, Handshake, Route, Scale, ExternalLink } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type SubLink = { label: string; href: string; icon: LucideIcon; external?: boolean }

const BEREICHE = [
  {
    label: 'Projekte & Archiv',
    href: '/bereich/projekte-archiv',
    color: 'var(--projekte)',
    dark: 'var(--projekte-dark)',
    subLinks: [
      { label: 'Alle Projekte', href: '/bereich/projekte-archiv/alle-projekte', icon: FolderOpen },
    ] as SubLink[],
  },
  {
    label: 'Zusammenarbeit',
    href: '/bereich/zusammenarbeit',
    color: 'var(--zusammenarbeit)',
    dark: 'var(--zusammenarbeit-dark)',
    subLinks: [
      { label: 'Module', href: '/bereich/zusammenarbeit/module', icon: Layout },
    ] as SubLink[],
  },
  {
    label: 'Grundlagen',
    href: '/bereich/grundlagen',
    color: 'var(--grundlagen)',
    dark: 'var(--grundlagen-dark)',
    subLinks: [
      { label: 'Methodensammlung', href: 'https://methoden.urbankit.de', icon: ExternalLink, external: true },
      { label: 'Partizipation', href: '/bereich/grundlagen/partizipation', icon: Handshake },
      { label: 'Projektplanung', href: '/bereich/grundlagen/projektplanung', icon: Route },
      { label: 'Rechtlicher Rahmen', href: '/bereich/grundlagen/recht', icon: Scale },
    ] as SubLink[],
  },
]

export function BereichSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname()
  const isBereich = BEREICHE.some((b) => pathname.includes(b.href))
  const [hovered, setHovered] = useState<string | null>(null)
  const [mobileTapped, setMobileTapped] = useState<string | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = (href: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setHovered(href)
  }
  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(null), 450)
  }

  if (!isBereich) return null

  return (
    <>
      {/* Desktop: vertical dot stack, fixed top-right below nav */}
      <div className="hidden md:flex fixed top-20 right-10 z-40 flex-col gap-4 items-end">
        {BEREICHE.map((b) => {
          const isActive = pathname.includes(b.href)
          const isHov = hovered === b.href
          return (
            <div
              key={b.href}
              className="relative flex items-center py-3 -my-3"
              onMouseEnter={() => handleEnter(b.href)}
              onMouseLeave={handleLeave}
            >
              {/* Text column: outer = hover zone + gap; inner = styled card */}
              <div
                className="absolute right-full top-2 pr-2 transition-all duration-300"
                onMouseEnter={() => handleEnter(b.href)}
                onMouseLeave={handleLeave}
                style={{
                  opacity: isHov ? 1 : 0,
                  pointerEvents: isHov ? 'auto' : 'none',
                }}
              >
                <div
                  className="flex flex-col items-start px-3 py-2 rounded-lg border"
                  style={{
                    background: 'white',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <Link
                    href={`/${locale}${b.href}`}
                    className="text-text whitespace-nowrap transition-opacity hover:opacity-70"
                    style={{ color: b.dark }}
                  >
                    {b.label}
                  </Link>
                  {b.subLinks.map((sub) => {
                    const Icon = sub.icon
                    const linkProps = sub.external
                      ? { href: sub.href, target: '_blank', rel: 'noopener noreferrer' }
                      : { href: `/${locale}${sub.href}` }
                    return (
                      <Link
                        key={sub.href}
                        {...linkProps}
                        className="inline-flex items-center gap-1.5 text-small whitespace-nowrap mt-1 transition-opacity opacity-60 hover:opacity-100"
                        style={{ color: b.dark }}
                      >
                        <Icon className="w-[1em] h-[1em] shrink-0" />
                        {sub.label}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Dot */}
              <Link href={`/${locale}${b.href}`}>
                <span style={{ fontSize: 'var(--text-text)', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.2em', height: '1.2em', flexShrink: 0 }}>
                  <Circle
                    fill="currentColor"
                    strokeWidth={0}
                    className="transition-all duration-300 shrink-0"
                    style={{
                      color: b.dark,
                      opacity: isActive ? 1 : isHov ? 0.85 : 0.3,
                      width: isActive || isHov ? '1.2em' : '1em',
                      height: isActive || isHov ? '1.2em' : '1em',
                      filter: isActive
                        ? `drop-shadow(0 0 4px ${b.dark}) drop-shadow(0 4px 6px rgba(0,0,0,0.10))`
                        : 'drop-shadow(0 4px 6px rgba(0,0,0,0.10)) drop-shadow(0 2px 4px rgba(0,0,0,0.10))',
                    }}
                  />
                </span>
              </Link>
            </div>
          )
        })}
      </div>

      {/* Mobile: horizontal dot pill, fixed bottom center — unchanged */}
      <div
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-end gap-1 px-3 py-2 rounded-full shadow-md"
        style={{ background: 'white' }}
      >
        {BEREICHE.map((b) => {
          const isActive = pathname.includes(b.href)
          const isTapped = mobileTapped === b.href

          return (
            <div key={b.href} className="flex flex-col items-center relative">
              <div
                className="absolute bottom-full mb-1 transition-all duration-200 pointer-events-none"
                style={{
                  opacity: isTapped ? 1 : 0,
                  transform: isTapped ? 'translateY(0)' : 'translateY(4px)',
                }}
              >
                <span
                  className="block whitespace-nowrap text-text px-2 py-1 rounded-md"
                  style={{ background: b.dark, color: 'white' }}
                >
                  {b.label}
                </span>
              </div>

              <span style={{ fontSize: 'var(--text-text)', lineHeight: 1, display: 'flex' }}>
                {isTapped ? (
                  <Link href={`/${locale}${b.href}`} onClick={() => setMobileTapped(null)} style={{ display: 'flex' }}>
                    <Circle
                      fill="currentColor"
                      strokeWidth={0}
                      className="transition-all duration-200 shrink-0"
                      style={{ color: b.dark, width: '1.2em', height: '1.2em', filter: `drop-shadow(0 0 5px ${b.dark})` }}
                    />
                  </Link>
                ) : (
                  <button onClick={() => setMobileTapped(b.href)} style={{ display: 'flex' }}>
                    <Circle
                      fill="currentColor"
                      strokeWidth={0}
                      className="transition-all duration-200 shrink-0"
                      style={{
                        color: b.dark,
                        opacity: isActive ? 1 : 0.35,
                        width: isActive ? '1em' : '0.85em',
                        height: isActive ? '1em' : '0.85em',
                      }}
                    />
                  </button>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
