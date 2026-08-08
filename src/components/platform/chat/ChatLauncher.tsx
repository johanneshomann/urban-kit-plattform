'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MessageCircle } from 'lucide-react'
import { IconTooltip } from '@/components/platform/IconTooltip'
import { useChatOverview } from './useChatOverview'
import { ChatPopup } from './ChatPopup'
import { ChatRoomList } from './ChatRoomList'
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
  const [open, setOpen] = useState(false)
  const [activeRoom, setActiveRoom] = useState<OverviewRoom | null>(null)
  const [dialog, setDialog] = useState<'dm' | 'group' | null>(null)
  const bubbleRef = useRef<HTMLButtonElement>(null)
  const { rooms, totalUnread, canCreateGroups, loading, refresh } = useChatOverview(open)

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
      <IconTooltip label={totalUnread > 0 ? t('openWithCount', { count: totalUnread }) : t('open')}>
        <button
          ref={bubbleRef}
          type="button"
          data-chat-launcher
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-label={totalUnread > 0 ? t('openWithCount', { count: totalUnread }) : t('open')}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            background: 'var(--project-accent, var(--app-accent))',
            color: 'var(--project-white, var(--app-white))',
            transition: 'background-color 250ms, transform 200ms, bottom 200ms',
          }}
        >
          <MessageCircle className="h-6 w-6" aria-hidden />
          {totalUnread > 0 && (
            <span
              aria-hidden
              className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[0.7rem] font-bold flex items-center justify-center shadow-sm"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      </IconTooltip>
      {/* Unread changes are announced once per change, not per poll */}
      <span className="sr-only" role="status" aria-live="polite">
        {totalUnread > 0 ? t('unreadBadge', { count: totalUnread }) : ''}
      </span>

      {open && (
        <ChatPopup
          title={activeRoom ? <ChatRoomContextHeader room={activeRoom} /> : t('title')}
          onBack={activeRoom ? () => setActiveRoom(null) : undefined}
          onClose={close}
        >
          {activeRoom ? (
            <ChatRoom roomId={activeRoom.id} onActivity={refresh} />
          ) : (
            <ChatRoomList
              rooms={rooms}
              canCreateGroups={canCreateGroups}
              loading={loading}
              onOpenRoom={(room) => setActiveRoom(room)}
              onNewDm={() => setDialog('dm')}
              onNewGroup={() => setDialog('group')}
              onChanged={() => void refresh()}
            />
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
