'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Plus, UsersRound, Check, Maximize2 } from 'lucide-react'
import { acceptInvite } from '@/modules/chat/actions'
import { ChatRoom } from './chat/ChatRoom'
import { NewDMDialog, NewGroupDialog } from './chat/NewChatDialogs'
import type { OverviewRoom } from './chat/types'

const INK = 'var(--project-dark, var(--plattform-ink))'
const ACCENT = 'var(--project-accent, var(--plattform-accent))'

/**
 * Chat body for the platform dock: inbox ⇄ room, plus the new-DM/new-group
 * dialogs. The room list and its polling live in the dock so the unread badge
 * stays live while the panel is closed.
 */
export function ChatPanel({ rooms, reload, canCreateGroups }: {
  rooms: OverviewRoom[]
  /** Refreshes the room list and resolves with the fresh rooms. */
  reload: (sync?: boolean) => Promise<OverviewRoom[]>
  canCreateGroups: boolean
}) {
  const t = useTranslations('chat')
  const [active, setActive] = useState<OverviewRoom | null>(null)
  const [dialog, setDialog] = useState<'dm' | 'group' | null>(null)

  // Both handlers open a room that only exists *after* the refresh, so they
  // read the list `reload` resolves with — the `rooms` prop is a render older.
  const accept = async (roomId: string) => {
    await acceptInvite(roomId)
    const fresh = await reload(false)
    const room = fresh.find((r) => r.id === roomId)
    if (room) setActive({ ...room, status: 'active' })
  }

  const onCreated = async (roomId: string) => {
    setDialog(null)
    const fresh = await reload(false)
    const room = fresh.find((r) => r.id === roomId)
    if (room) setActive(room)
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="h-10 shrink-0 flex items-center gap-2 px-2 border-b" style={{ borderColor: 'var(--project-light, #e5e7eb)' }}>
        {active ? (
          <>
            <button type="button" onClick={() => setActive(null)} className="p-1 rounded hover:bg-black/5" style={{ color: INK }}>
              <ChevronLeft aria-hidden="true" className="w-4 h-4" />
              <span className="sr-only">{t('backToInbox')}</span>
            </button>
            <span className="text-small font-semibold truncate" style={{ color: INK }}>{active.name}</span>
          </>
        ) : (
          <span className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setDialog('dm')} title={t('newDm')} className="p-1.5 rounded hover:bg-black/5" style={{ color: INK }}>
              <Plus aria-hidden="true" className="w-4 h-4" />
              <span className="sr-only">{t('newDm')}</span>
            </button>
            {canCreateGroups && (
              <button type="button" onClick={() => setDialog('group')} title={t('newGroup')} className="p-1.5 rounded hover:bg-black/5" style={{ color: INK }}>
                <UsersRound aria-hidden="true" className="w-4 h-4" />
                <span className="sr-only">{t('newGroup')}</span>
              </button>
            )}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {active ? (
          <ChatRoom roomId={active.id} title="" />
        ) : (
          <div className="h-full overflow-y-auto py-1">
            {rooms.length === 0 && (
              <p className="text-small px-4 py-8 text-center flex flex-col items-center gap-2" style={{ color: INK, opacity: 0.55 }}>
                <Maximize2 aria-hidden="true" className="w-5 h-5 opacity-60" />
                {t('empty')}
              </p>
            )}
            {rooms.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => (r.status === 'active' ? setActive(r) : undefined)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-black/5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-small font-medium truncate" style={{ color: INK }}>{r.name}</span>
                    {r.project && <span className="text-small truncate shrink-0 max-w-[8rem]" style={{ color: INK, opacity: 0.55 }}>· {r.project.title}</span>}
                    {r.unread > 0 && (
                      <span className="ml-auto shrink-0 text-small text-white rounded-full px-1.5" style={{ background: ACCENT }}>{r.unread}</span>
                    )}
                  </div>
                  {r.status === 'invited'
                    ? <span className="text-small" style={{ color: ACCENT }}>{t('invitation')}</span>
                    : <p className="text-small truncate" style={{ color: INK, opacity: 0.55 }}>{r.lastMessagePreview || ' '}</p>}
                </div>
                {r.status === 'invited' && (
                  <span
                    onClick={(e) => { e.stopPropagation(); accept(r.id) }}
                    className="shrink-0 p-1 rounded text-white cursor-pointer"
                    style={{ background: ACCENT }}
                    title={t('acceptInvite')}
                  >
                    <Check aria-hidden="true" className="w-3.5 h-3.5" />
                    <span className="sr-only">{t('acceptInvite')}</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {dialog === 'dm' && <NewDMDialog onClose={() => setDialog(null)} onCreated={onCreated} />}
      {dialog === 'group' && <NewGroupDialog onClose={() => setDialog(null)} onCreated={onCreated} />}
    </div>
  )
}
