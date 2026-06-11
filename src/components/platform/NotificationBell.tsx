'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, BarChart2, Calendar, Newspaper, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export type NotificationItem = {
  type: 'poll' | 'event' | 'news'
  title: string
  projectTitle: string
  projectSlug: string
  date?: string
  schemeMid: string
  schemeAccent: string
  schemeLight: string
  schemeDark: string
}

interface NotificationBellProps {
  locale: string
  items: NotificationItem[]
}

function formatDate(dateStr: string): string {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Heute'
  if (days === 1) return 'Morgen'
  if (days > 1 && days <= 7) return `In ${days} Tagen`
  const diff = Date.now() - new Date(dateStr).getTime()
  const ago = Math.floor(diff / (1000 * 60 * 60))
  if (ago < 1) return 'Gerade eben'
  if (ago < 24) return `Vor ${ago}h`
  const days2 = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days2 === 1) return 'Gestern'
  return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

const typeIcon = {
  poll:  BarChart2,
  event: Calendar,
  news:  Newspaper,
}

const typeLabel = {
  poll:  'Umfrage',
  event: 'Veranstaltung',
  news:  'Nachricht',
}

const ANIM_DURATION = 150

export function NotificationBell({ locale, items }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => {
    setClosing(true)
    timer.current = setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, ANIM_DURATION)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [close])

  const isVisible = open && !closing

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => open ? close() : setOpen(true)}
        className="flex items-center transition-colors cursor-pointer"
        style={{ color: open ? 'var(--plattform-accent)' : 'var(--plattform-ink)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--plattform-accent)')}
        onMouseLeave={e => !open && (e.currentTarget.style.color = 'var(--plattform-ink)')}
      >
        <Bell className="text-text w-[1em] h-[1em] shrink-0" />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-3 w-80 rounded-xl border bg-white shadow-sm overflow-hidden z-50 ${isVisible ? 'dropdown-enter' : 'dropdown-exit'}`}
        >
          <div className="px-4 py-3 border-b">
            <p className="text-small font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>Aktivitäten</p>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-small opacity-40">Keine aktuellen Aktivitäten.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((item, i) => {
                const Icon = typeIcon[item.type]
                return (
                  <Link
                    key={i}
                    href={`/${locale}/dashboard/projekte/${item.projectSlug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 border-b last:border-0"
                  >
                    {/* Color dot */}
                    <div
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ background: item.schemeMid }}
                    />

                    {/* Icon */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: item.schemeLight }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: item.schemeMid }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-small font-medium truncate" style={{ color: 'var(--plattform-ink)' }}>
                        {item.title}
                      </p>
                      <p className="text-small truncate" style={{ color: 'var(--plattform-ink)', opacity: 0.45 }}>
                        {item.projectTitle} · {typeLabel[item.type]}
                      </p>
                    </div>

                    {/* Date */}
                    {item.date && (
                      <span className="text-small shrink-0" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }}>
                        {formatDate(item.date)}
                      </span>
                    )}

                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-20" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
