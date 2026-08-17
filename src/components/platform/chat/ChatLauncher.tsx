// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Bell, MessageCircle } from 'lucide-react'
import { IconTooltip } from '@/components/platform/IconTooltip'
import { useChatOverview } from './useChatOverview'
import { useNotifications } from './useNotifications'
import { ChatPopup } from './ChatPopup'
import { ChatRoomList } from './ChatRoomList'
import { NotificationList } from './NotificationList'
import { ChatRoom } from './ChatRoom'
import { ChatRoomContextHeader } from './ChatRoomContextHeader'
import { NewDMDialog, NewGroupDialog } from './NewChatDialogs'
import type { OverviewRoom } from './types'

/**
 * Platform-wide floating chat: bubble bottom-right with a live unread badge,
 * opening the popup (room list ⇄ room view). Mounted ONCE in the dashboard
 * layout, so open state and messages survive dashboard ⇄ workspace
 * navigation. Colors inherit the project chameleon (`--project-*` on <html>
 * inside a workspace) with `--app-*` fallbacks — the palette handover is the
 * cue that chat follows you across contexts.
 *
 * Deep link: `?chat=1` opens the popup, `?chat=<roomId>` opens a room
 * (used by the /m/chat redirect).
 */
export function ChatLauncher() {
  const t = useTranslations('chat')
  const tn = useTranslations('notifications')
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'chat' | 'notifications'>('chat')
  const [activeRoom, setActiveRoom] = useState<OverviewRoom | null>(null)
  const [dialog, setDialog] = useState<'dm' | 'group' | null>(null)
  const bubbleRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const { rooms, myProjects, totalUnread, canCreateGroups, loading, refresh } = useChatOverview(open)
  const notifications = useNotifications(open && tab === 'notifications')

  // Viewing the Mitteilungen tab clears the badge (rows keep their highlight).
  useEffect(() => {
    if (open && tab === 'notifications') void notifications.markAllRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, notifications.items.length])

  const combinedUnread = totalUnread + notifications.unread

  // Inside a workspace, that project's section surfaces first in the list.
  const currentProjectSlug = pathname?.match(/\/dashboard\/projekte\/([^/]+)/)?.[1] ?? null

  // ?chat= deep link — read once on mount (plain URL read avoids the
  // useSearchParams suspense requirement in a layout-mounted component).
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('chat')
    if (!value) return
    setOpen(true)
    if (value !== '1') {
      void fetch('/api/chat/overview')
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          const room = (res?.rooms as OverviewRoom[] | undefined)?.find((x) => x.id === value)
          if (room && room.status === 'active') setActiveRoom(room)
        })
        .catch(() => {})
    }
  }, [])

  // Keep the active room's header in sync with fresh overview data.
  useEffect(() => {
    if (!activeRoom) return
    const fresh = rooms.find((r) => r.id === activeRoom.id)
    if (fresh && fresh !== activeRoom) setActiveRoom(fresh)
    // Room vanished (deleted / module disabled) → back to the list.
    if (!loading && rooms.length > 0 && !fresh) setActiveRoom(null)
  }, [rooms, loading, activeRoom])

  const close = () => {
    setOpen(false)
    setDialog(null)
    bubbleRef.current?.focus()
  }

  const roomTitle = (room: OverviewRoom): string =>
    room.name ?? (room.type === 'dm' ? t('dmFallback') : t('roomFallback'))

  return (
    <>
      <IconTooltip label={combinedUnread > 0 ? t('openWithCount', { count: combinedUnread }) : t('open')}>
        <button
          ref={bubbleRef}
          type="button"
          data-chat-launcher
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-label={combinedUnread > 0 ? t('openWithCount', { count: combinedUnread }) : t('open')}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            background: 'var(--project-accent, var(--app-accent))',
            color: 'var(--project-white, var(--app-white))',
            transition: 'background-color 250ms, transform 200ms, bottom 200ms',
          }}
        >
          {/* Chat glyph + bell overlay — the popup holds BOTH chat and
              notifications, so the bubble must not read as chat-only. */}
          <span className="relative" aria-hidden>
            <MessageCircle className="h-6 w-6" />
            <span
              className="absolute -bottom-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full shadow-sm"
              style={{ background: 'var(--project-white, var(--app-white))', color: 'var(--project-accent, var(--app-accent))' }}
            >
              <Bell className="h-2.5 w-2.5" />
            </span>
          </span>
          {combinedUnread > 0 && (
            <span
              aria-hidden
              className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-[0.7rem] font-bold flex items-center justify-center shadow-sm"
              style={{ background: 'var(--project-accent, var(--app-accent))', color: 'var(--project-white, var(--app-white))' }}
            >
              {combinedUnread > 99 ? '99+' : combinedUnread}
            </span>
          )}
        </button>
      </IconTooltip>
      {/* Unread changes are announced once per change, not per poll */}
      <span className="sr-only" role="status" aria-live="polite">
        {combinedUnread > 0 ? t('unreadBadge', { count: combinedUnread }) : ''}
      </span>

      {open && (
        <ChatPopup
          title={activeRoom ? <ChatRoomContextHeader room={activeRoom} /> : t('title')}
          onBack={activeRoom ? () => setActiveRoom(null) : undefined}
          onClose={close}
        >
          {activeRoom ? (
            <ChatRoom roomId={activeRoom.id} projectSlug={activeRoom.project?.slug ?? null} onActivity={refresh} />
          ) : (
            <>
              {/* Chat ⇄ Mitteilungen tab switcher (feed sort-toggle idiom) */}
              <div className="shrink-0 flex items-center gap-1 rounded-lg p-0.5 h-9 mx-3 mt-3 bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_6%,transparent)]">
                {(['chat', 'notifications'] as const).map((key) => {
                  const active = tab === key
                  const badge = key === 'chat' ? totalUnread : notifications.unread
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      aria-pressed={active}
                      className="flex-1 h-full rounded-md text-small font-medium transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-1.5"
                      style={{
                        background: active ? 'var(--project-accent, var(--app-accent))' : 'transparent',
                        color: active ? 'var(--project-white, var(--app-white))' : 'var(--project-ink, var(--app-ink))',
                      }}
                    >
                      {key === 'chat' ? t('tabLabel') : tn('heading')}
                      {badge > 0 && (
                        <span
                          className="min-w-4 h-4 px-1 rounded-full text-[0.65rem] font-bold flex items-center justify-center"
                          style={{
                            background: active ? 'var(--project-white, var(--app-white))' : 'var(--project-accent, var(--app-accent))',
                            color: active ? 'var(--project-accent, var(--app-accent))' : 'var(--project-white, var(--app-white))',
                          }}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {tab === 'chat' ? (
                <ChatRoomList
                  rooms={rooms}
                  myProjects={myProjects}
                  canCreateGroups={canCreateGroups}
                  currentProjectSlug={currentProjectSlug}
                  loading={loading}
                  onOpenRoom={(room) => setActiveRoom(room)}
                  onNewDm={() => setDialog('dm')}
                  onNewGroup={() => setDialog('group')}
                  onChanged={() => void refresh()}
                />
              ) : (
                <NotificationList items={notifications.items} loading={notifications.loading} onChanged={() => void notifications.refresh()} />
              )}
            </>
          )}
        </ChatPopup>
      )}

      {dialog === 'dm' && (
        <NewDMDialog
          onClose={() => setDialog(null)}
          onCreated={(roomId) => {
            setDialog(null)
            void refresh().then(() => {
              setActiveRoom((prev) => prev ?? ({ id: roomId, type: 'dm', name: null, role: 'member', status: 'active', project: null, other: null, lastMessageAt: new Date().toISOString(), lastMessagePreview: '', unread: 0 } satisfies OverviewRoom))
            })
          }}
        />
      )}
      {dialog === 'group' && (
        <NewGroupDialog
          assignableProjects={myProjects.filter((p) => p.isPM || p.groupAssignmentEnabled)}
          onClose={() => setDialog(null)}
          onCreated={(roomId) => {
            setDialog(null)
            void refresh().then(() => {
              setActiveRoom((prev) => prev ?? ({ id: roomId, type: 'group', name: null, role: 'owner', status: 'active', project: null, other: null, lastMessageAt: new Date().toISOString(), lastMessagePreview: '', unread: 0 } satisfies OverviewRoom))
            })
          }}
        />
      )}
    </>
  )
}
