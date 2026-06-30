'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageCircle, Users, User, Plus, UsersRound, Check } from 'lucide-react'
import { acceptInvite } from '@/modules/chat/actions'
import { ChatRoom } from './ChatRoom'
import { NewDMDialog, NewGroupDialog } from './NewChatDialogs'
import type { OverviewRoom, RoomType } from './types'

const OVERVIEW_POLL_MS = 5000

const SECTION: { type: RoomType; label: string; icon: typeof MessageCircle }[] = [
  { type: 'project', label: 'Projekte', icon: Users },
  { type: 'group', label: 'Gruppen', icon: UsersRound },
  { type: 'dm', label: 'Direktnachrichten', icon: User },
]

export function ChatLayout({ canCreateGroups, projectSlug, initialRoomId }: { canCreateGroups: boolean; projectSlug?: string; initialRoomId?: string }) {
  const [rooms, setRooms] = useState<OverviewRoom[]>([])
  const [selected, setSelected] = useState<string | null>(initialRoomId ?? null)
  const [dialog, setDialog] = useState<'dm' | 'group' | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/chat/overview').then((r) => r.json()).catch(() => null)
    if (!res) return
    let list = (res.rooms ?? []) as OverviewRoom[]
    if (projectSlug) list = list.filter((r) => r.type === 'project' && r.project?.slug === projectSlug)
    setRooms(list)
    setSelected((cur) => cur ?? (list[0]?.status === 'active' ? list[0].id : null))
  }, [projectSlug])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const id = setInterval(load, OVERVIEW_POLL_MS)
    return () => clearInterval(id)
  }, [load])

  const onCreated = (roomId: string) => { setDialog(null); setSelected(roomId); load() }
  const accept = async (roomId: string) => { await acceptInvite(roomId); setSelected(roomId); load() }

  const grouped = useMemo(() => {
    const by: Record<RoomType, OverviewRoom[]> = { project: [], group: [], dm: [] }
    for (const r of rooms) by[r.type].push(r)
    return by
  }, [rooms])

  const selectedRoom = rooms.find((r) => r.id === selected && r.status === 'active') ?? null

  return (
    <div className="flex h-full min-h-0 border rounded-xl overflow-hidden bg-white" style={{ borderColor: '#e5e7eb' }}>
      {/* Room list */}
      <aside className="w-72 shrink-0 border-r flex flex-col min-h-0" style={{ borderColor: '#e5e7eb' }}>
        {!projectSlug && (
          <div className="p-2 flex gap-2 border-b" style={{ borderColor: '#e5e7eb' }}>
            <button type="button" onClick={() => setDialog('dm')} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-small font-medium text-white" style={{ background: 'var(--plattform)' }}>
              <Plus className="w-3.5 h-3.5" /> Nachricht
            </button>
            {canCreateGroups && (
              <button type="button" onClick={() => setDialog('group')} className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-small font-medium border" style={{ borderColor: 'var(--plattform)', color: 'var(--plattform)' }}>
                <UsersRound className="w-3.5 h-3.5" /> Gruppe
              </button>
            )}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          {rooms.length === 0 && <p className="text-small text-gray-400 px-4 py-6 text-center">Noch keine Unterhaltungen.</p>}
          {SECTION.map(({ type, label, icon: Icon }) => grouped[type].length > 0 && (
            <div key={type} className="mb-2">
              {!projectSlug && (
                <div className="flex items-center gap-1.5 px-3 py-1 text-small font-semibold text-gray-400 uppercase tracking-wide">
                  <Icon className="w-3 h-3" /> {label}
                </div>
              )}
              {grouped[type].map((r) => (
                <button key={r.id} type="button" onClick={() => r.status === 'active' ? setSelected(r.id) : undefined}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                  style={{ background: r.id === selected ? 'var(--plattform-light)' : undefined }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text font-medium truncate" style={{ color: 'var(--plattform-ink)' }}>{r.name}</span>
                      {r.unread > 0 && <span className="ml-auto shrink-0 text-small text-white rounded-full px-1.5" style={{ background: 'var(--plattform)' }}>{r.unread}</span>}
                    </div>
                    {r.status === 'invited'
                      ? <span className="text-small" style={{ color: 'var(--plattform)' }}>Einladung</span>
                      : <p className="text-small text-gray-400 truncate">{r.lastMessagePreview || ' '}</p>}
                  </div>
                  {r.status === 'invited' && (
                    <span onClick={(e) => { e.stopPropagation(); accept(r.id) }} className="shrink-0 p-1 rounded text-white" style={{ background: 'var(--plattform)' }} title="Annehmen">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Active room */}
      <section className="flex-1 min-h-0">
        {selectedRoom
          ? <ChatRoom roomId={selectedRoom.id} title={selectedRoom.name} />
          : <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <MessageCircle className="w-8 h-8" />
              <p className="text-small">Wählen Sie eine Unterhaltung.</p>
            </div>}
      </section>

      {dialog === 'dm' && <NewDMDialog onClose={() => setDialog(null)} onCreated={onCreated} />}
      {dialog === 'group' && <NewGroupDialog onClose={() => setDialog(null)} onCreated={onCreated} />}
    </div>
  )
}
