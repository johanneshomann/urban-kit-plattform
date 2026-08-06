'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquare, X } from 'lucide-react'
import { ChatPanel } from './ChatPanel'
import { NotificationList, type NotificationItem } from './NotificationList'
import type { OverviewRoom } from './chat/types'

const POLL_OPEN_MS = 5000
const POLL_CLOSED_MS = 20000

const INK = 'var(--project-dark, var(--plattform-ink))'
const ACCENT = 'var(--project-accent, var(--plattform-accent))'

type Tab = 'chat' | 'activity'

/**
 * Floating dock for the logged-in area — the platform header's messaging and
 * activity surfaces, now a single FAB (mirroring the accessibility button on
 * the opposite corner) with a two-tab panel. Chat polling runs while closed so
 * the unread badge stays live; an open conversation survives navigation
 * because the dock lives in the persistent dashboard layout.
 */
export function PlatformDock({ locale, notificationItems, canCreateGroups }: {
  locale: string
  notificationItems: NotificationItem[]
  canCreateGroups: boolean
}) {
  const t = useTranslations('platform')
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('chat')
  const [rooms, setRooms] = useState<OverviewRoom[]>([])
  const [synced, setSynced] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const tabPanelId = `${panelId}-panel`
  const chatTabId = `${panelId}-chat`
  const activityTabId = `${panelId}-activity`

  // Returns the freshly fetched rooms so callers can act on them without
  // reading a `rooms` prop captured before the refresh.
  const load = useCallback(async (sync = false): Promise<OverviewRoom[]> => {
    const res = await fetch(`/api/chat/overview${sync ? '?sync=1' : ''}`).then((r) => r.json()).catch(() => null)
    if (!res) return []
    const next = (res.rooms ?? []) as OverviewRoom[]
    setRooms(next)
    return next
  }, [])

  // Slow poll while closed (badge only), fast while open. The first open syncs
  // project-room memberships so late joiners get added to their project rooms.
  useEffect(() => {
    const sync = open && !synced
    if (sync) setSynced(true)
    load(sync)
    const id = setInterval(() => load(false), open ? POLL_OPEN_MS : POLL_CLOSED_MS)
    return () => clearInterval(id)
  }, [open, synced, load])

  // Close on Escape (returning focus to the trigger) and on outside click.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  const unread = rooms.reduce((s, r) => s + r.unread, 0)
  const badgeCount = unread + notificationItems.length

  const tabButton = (id: Tab, domId: string, label: string, count: number) => {
    const selected = tab === id
    return (
      <button
        type="button"
        role="tab"
        id={domId}
        aria-selected={selected}
        aria-controls={tabPanelId}
        onClick={() => setTab(id)}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-small font-medium border-b-2 transition-colors"
        style={{
          color: INK,
          opacity: selected ? 1 : 0.6,
          borderColor: selected ? ACCENT : 'transparent',
        }}
      >
        {label}
        {count > 0 && (
          <span
            className="min-w-[1.15rem] rounded-full px-1 text-[0.65rem] font-bold leading-[1.15rem] text-center text-white"
            style={{ background: ACCENT }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    )
  }

  return (
    <div ref={containerRef} data-platform-dock className="fixed bottom-6 right-6 z-40">
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label={t('dockTitle')}
          tabIndex={-1}
          className="dropdown-enter absolute bottom-full right-0 mb-3 flex flex-col rounded-xl border overflow-hidden outline-none"
          style={{
            width: 'min(24rem, calc(100vw - 3rem))',
            height: 'min(34rem, calc(100svh - 8rem))',
            background: 'var(--project-white, #ffffff)',
            borderColor: 'var(--project-light, #e5e7eb)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
          }}
        >
          <div className="shrink-0 flex items-center gap-1 pr-1 border-b" style={{ borderColor: 'var(--project-light, #e5e7eb)' }}>
            <div role="tablist" aria-label={t('dockTitle')} className="flex flex-1 min-w-0">
              {tabButton('chat', chatTabId, t('navMessages'), unread)}
              {tabButton('activity', activityTabId, t('notifActivities'), notificationItems.length)}
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); buttonRef.current?.focus() }}
              aria-label={t('dockClose')}
              className="shrink-0 inline-flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-black/5"
              style={{ color: INK }}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div
            role="tabpanel"
            id={tabPanelId}
            aria-labelledby={tab === 'chat' ? chatTabId : activityTabId}
            className="flex-1 min-h-0 flex flex-col"
          >
            {tab === 'chat'
              ? <ChatPanel rooms={rooms} reload={load} canCreateGroups={canCreateGroups} />
              : <NotificationList locale={locale} items={notificationItems} onNavigate={() => setOpen(false)} />}
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={badgeCount > 0 ? t('dockOpenWithCount', { count: badgeCount }) : t('dockOpen')}
        className="relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ background: ACCENT, color: 'var(--project-white, #ffffff)' }}
      >
        <MessageSquare aria-hidden="true" className="h-5 w-5" />
        {badgeCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 min-w-[1.25rem] rounded-full px-1 text-[0.65rem] font-bold leading-5 text-center"
            style={{ background: 'var(--project-dark, var(--plattform-ink))', color: 'var(--project-white, #ffffff)' }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>
    </div>
  )
}
