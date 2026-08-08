'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MessageSquarePlus, Users, FolderKanban, UserCircle } from 'lucide-react'
import { acceptInvite } from '@/modules/chat/actions'
import type { OverviewRoom } from './types'

/** Compact relative time for the room list, reusing the platform date keys. */
function useRelativeTime() {
  const tp = useTranslations('platform')
  const locale = useLocale()
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 0) return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short' })
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return tp('dateJustNow')
    if (minutes < 60) return tp('dateMinutesAgo', { minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return tp('dateHoursAgo', { hours })
    const days = Math.floor(hours / 24)
    if (days === 1) return tp('dateYesterday')
    return tp('dateDaysAgo', { days })
  }
}

function roomIcon(type: OverviewRoom['type']) {
  const className = 'h-4 w-4 shrink-0'
  if (type === 'project') return <FolderKanban className={className} aria-hidden />
  if (type === 'group') return <Users className={className} aria-hidden />
  return <UserCircle className={className} aria-hidden />
}

/**
 * The popup's inbox: every room with preview, relative time and unread pill;
 * pending group invites render an inline accept button. New-DM / new-group
 * entry points on top (the group button only for PMs — the action re-checks).
 */
export function ChatRoomList({
  rooms,
  canCreateGroups,
  loading,
  onOpenRoom,
  onNewDm,
  onNewGroup,
  onChanged,
}: {
  rooms: OverviewRoom[]
  canCreateGroups: boolean
  loading: boolean
  onOpenRoom: (room: OverviewRoom) => void
  onNewDm: () => void
  onNewGroup: () => void
  onChanged: () => void
}) {
  const t = useTranslations('chat')
  const relTime = useRelativeTime()
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const accept = (roomId: string) => {
    setError(null)
    startTransition(async () => {
      const res = await acceptInvite(roomId)
      if (res.error) setError(res.error)
      onChanged()
    })
  }

  const roomName = (room: OverviewRoom): string =>
    room.name ?? (room.type === 'dm' ? t('dmFallback') : t('roomFallback'))

  /** One-line "who is this" context per row — the cue exists before opening. */
  const contextLabel = (room: OverviewRoom): string | null => {
    if (room.project) return room.project.title
    if (room.type === 'dm') {
      const count = room.other?.sharedProjects?.length ?? 0
      return count > 0 ? t('sharedProjectsCount', { count }) : null
    }
    if (room.type === 'group') return t('memberCount', { count: room.memberCount ?? 0 })
    return null
  }

  const actionButton =
    'flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-small font-medium cursor-pointer transition-colors bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_18%,transparent)]'

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 flex gap-2 px-3 pt-3">
        <button type="button" onClick={onNewDm} className={actionButton} style={{ color: 'var(--project-accent, var(--app-accent))' }}>
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          {t('newDm')}
        </button>
        {canCreateGroups && (
          <button type="button" onClick={onNewGroup} className={actionButton} style={{ color: 'var(--project-accent, var(--app-accent))' }}>
            <Users className="h-4 w-4" aria-hidden />
            {t('newGroup')}
          </button>
        )}
      </div>

      {error && <p className="shrink-0 px-4 pt-2 text-small text-red-700">{error}</p>}

      <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 p-3" role="list">
        {rooms.length === 0 && (
          <li className="m-auto text-small opacity-50 py-8">{loading ? '…' : t('empty')}</li>
        )}
        {rooms.map((room, i) => (
          <li key={room.id} className="card-in" style={{ animationDelay: `${Math.min(i * 25, 200)}ms` }}>
            {room.status === 'invited' ? (
              <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_8%,transparent)]">
                <div className="min-w-0">
                  <p className="text-small font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--project-accent, var(--app-ink-accent))' }}>
                    {roomIcon(room.type)}
                    {roomName(room)}
                  </p>
                  <p className="text-small opacity-60">{t('invitation')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => accept(room.id)}
                  className="shrink-0 h-8 px-3 rounded-lg text-small font-semibold cursor-pointer transition-colors bg-[var(--project-accent,var(--app-accent))] text-[var(--project-white,var(--app-white))] hover:opacity-90"
                >
                  {t('acceptInvite')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenRoom(room)}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_6%,transparent)]"
              >
                <span aria-hidden className="shrink-0 opacity-60" style={{ color: 'var(--project-accent, var(--app-accent))' }}>
                  {roomIcon(room.type)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`text-small truncate ${room.unread > 0 ? 'font-bold' : 'font-medium'}`} style={{ color: 'var(--project-accent, var(--app-ink-accent))' }}>
                      {roomName(room)}
                    </span>
                    <span className="text-[0.7rem] shrink-0 opacity-50">{relTime(room.lastMessageAt)}</span>
                  </span>
                  <span className="block text-small truncate opacity-60">
                    {[contextLabel(room), room.lastMessagePreview || t('noMessages')].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {room.unread > 0 && (
                  <span
                    className="shrink-0 min-w-5 h-5 px-1.5 rounded-full text-[0.7rem] font-bold flex items-center justify-center bg-[var(--project-accent,var(--app-accent))] text-[var(--project-white,var(--app-white))]"
                    aria-label={t('unreadBadge', { count: room.unread })}
                  >
                    {room.unread > 99 ? '99+' : room.unread}
                  </span>
                )}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
