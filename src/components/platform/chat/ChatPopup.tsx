'use client'

import { useCallback, useEffect, useState } from 'react'
import { MessageSquare, X, ChevronLeft, Plus, UsersRound, Check, Maximize2 } from 'lucide-react'
import { acceptInvite } from '@/modules/chat/actions'
import { ChatRoom } from './ChatRoom'
import { NewDMDialog, NewGroupDialog } from './NewChatDialogs'
import type { OverviewRoom } from './types'

const POLL_OPEN_MS = 5000
const POLL_CLOSED_MS = 20000

const INK = 'var(--project-dark, var(--plattform-ink))'
const ACCENT = 'var(--project-accent, var(--plattform-accent))'

/**
 * Header chat: unread-badged button + floating panel (inbox ⇄ room).
 * Lives in the persistent dashboard layout, so an open conversation survives
 * navigation — chat alongside browsing. No backdrop: the page stays usable.
 */
export function ChatPopup({ canCreateGroups }: { canCreateGroups: boolean }) {
  const [open, setOpen] = useState(false)
  const [rooms, setRooms] = useState<OverviewRoom[]>([])
  const [active, setActive] = useState<OverviewRoom | null>(null)
  const [dialog, setDialog] = useState<'dm' | 'group' | null>(null)
  const [synced, setSynced] = useState(false)

  const load = useCallback(async (sync = false) => {
    const res = await fetch(`/api/chat/overview${sync ? '?sync=1' : ''}`).then((r) => r.json()).catch(() => null)
    if (res) setRooms((res.rooms ?? []) as OverviewRoom[])
  }, [])

  // Poll: slow while closed (badge only), fast while open. First open syncs
  // project-room memberships (late joiners get auto-added to project rooms).
  useEffect(() => {
    const sync = open && !synced
    if (sync) setSynced(true)
    load(sync)
    const id = setInterval(() => load(false), open ? POLL_OPEN_MS : POLL_CLOSED_MS)
    return () => clearInterval(id)
  }, [open, synced, load])

  const totalUnread = rooms.reduce((s, r) => s + r.unread, 0)

  const openRoom = (room: OverviewRoom) => setActive(room)
  const accept = async (roomId: string) => {
    await acceptInvite(roomId)
    await load(false)
    const room = rooms.find((r) => r.id === roomId)
    if (room) setActive({ ...room, status: 'active' })
  }
  const onCreated = (roomId: string) => {
    setDialog(null)
    load(false).then(() => {
      setActive((cur) => cur ?? null)
      setRooms((rs) => {
        const room = rs.find((r) => r.id === roomId)
        if (room) setActive(room)
        return rs
      })
    })
  }

  return (
    <div className="relative flex items-center">
      {/* Header button with unread badge */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center transition-colors cursor-pointer relative"
        style={{ color: INK }}
        onMouseEnter={(e) => { e.currentTarget.style.color = ACCENT }}
        onMouseLeave={(e) => { e.currentTarget.style.color = INK }}
      >
        <MessageSquare className="text-text w-[1em] h-[1em] shrink-0" />
        {totalUnread > 0 && (
          <span
            className="absolute -top-1.5 -right-2 text-white rounded-full leading-none px-1 py-0.5 text-center"
            style={{ background: ACCENT, fontSize: '0.6rem', fontWeight: 700, minWidth: '1.1rem' }}
          >
            {totalUnread}
          </span>
        )}
      </button>

      {/* Floating panel — no backdrop, page stays interactive */}
      {open && (
        <div
          className="absolute right-0 top-full mt-3 z-50 flex flex-col rounded-xl border shadow-xl overflow-hidden transition-colors duration-500"
          style={{
            width: 'min(24rem, calc(100vw - 2rem))',
            height: 'min(34rem, calc(100vh - 6rem))',
            background: 'var(--project-white, #ffffff)',
            borderColor: 'var(--project-light, #e5e7eb)',
          }}
        >
          {/* Panel header */}
          <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b" style={{ borderColor: 'var(--project-light, #e5e7eb)' }}>
            {active ? (
              <button type="button" onClick={() => setActive(null)} className="p-1 rounded hover:bg-black/5" style={{ color: INK }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-small font-semibold px-1" style={{ color: INK }}>Nachrichten</span>
            )}
            {active && <span className="text-small font-semibold truncate" style={{ color: INK }}>{active.name}</span>}
            <span className="ml-auto flex items-center gap-1">
              {!active && (
                <>
                  <button type="button" onClick={() => setDialog('dm')} title="Neue Direktnachricht" className="p-1.5 rounded hover:bg-black/5" style={{ color: INK }}>
                    <Plus className="w-4 h-4" />
                  </button>
                  {canCreateGroups && (
                    <button type="button" onClick={() => setDialog('group')} title="Neue Gruppe" className="p-1.5 rounded hover:bg-black/5" style={{ color: INK }}>
                      <UsersRound className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
              <button type="button" onClick={() => { setOpen(false); setActive(null) }} title="Schließen" className="p-1.5 rounded hover:bg-black/5" style={{ color: INK }}>
                <X className="w-4 h-4" />
              </button>
            </span>
          </div>

          {/* Body: room or inbox list */}
          <div className="flex-1 min-h-0">
            {active ? (
              <ChatRoom roomId={active.id} title="" />
            ) : (
              <div className="h-full overflow-y-auto py-1">
                {rooms.length === 0 && (
                  <p className="text-small text-gray-400 px-4 py-8 text-center flex flex-col items-center gap-2">
                    <Maximize2 className="w-5 h-5 opacity-40" />
                    Noch keine Unterhaltungen.
                  </p>
                )}
                {rooms.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => (r.status === 'active' ? openRoom(r) : undefined)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-black/5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-small font-medium truncate" style={{ color: INK }}>{r.name}</span>
                        {r.project && <span className="text-small text-gray-400 truncate shrink-0 max-w-[8rem]">· {r.project.title}</span>}
                        {r.unread > 0 && (
                          <span className="ml-auto shrink-0 text-small text-white rounded-full px-1.5" style={{ background: ACCENT }}>{r.unread}</span>
                        )}
                      </div>
                      {r.status === 'invited'
                        ? <span className="text-small" style={{ color: ACCENT }}>Einladung</span>
                        : <p className="text-small text-gray-400 truncate">{r.lastMessagePreview || ' '}</p>}
                    </div>
                    {r.status === 'invited' && (
                      <span
                        onClick={(e) => { e.stopPropagation(); accept(r.id) }}
                        className="shrink-0 p-1 rounded text-white cursor-pointer"
                        style={{ background: ACCENT }}
                        title="Annehmen"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {dialog === 'dm' && <NewDMDialog onClose={() => setDialog(null)} onCreated={onCreated} />}
      {dialog === 'group' && <NewGroupDialog onClose={() => setDialog(null)} onCreated={onCreated} />}
    </div>
  )
}
