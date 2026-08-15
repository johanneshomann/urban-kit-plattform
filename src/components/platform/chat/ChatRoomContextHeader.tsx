// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useTranslations } from 'next-intl'
import { UserCircle } from 'lucide-react'
import type { OverviewRoom } from './types'

/**
 * The "who am I chatting with" cue in the popup header: room name plus a
 * context line — project chip (project rooms / project-assigned groups),
 * shared-project pills for DMs, member count + owner for groups.
 */
export function ChatRoomContextHeader({ room }: { room: OverviewRoom }) {
  const t = useTranslations('chat')
  const name = room.name ?? (room.type === 'dm' ? t('dmFallback') : t('roomFallback'))

  return (
    <div className="min-w-0 flex items-center gap-2">
      {room.type === 'dm' && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--project-accent, var(--app-accent)) 12%, transparent)' }}>
          {room.other?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={room.other.avatarUrl} alt="" aria-hidden className="h-full w-full object-cover" />
          ) : (
            <UserCircle className="h-5 w-5 opacity-50" aria-hidden />
          )}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-text font-semibold truncate leading-tight" style={{ color: 'var(--project-accent, var(--app-ink-accent))' }}>
          {name}
        </span>
        <span className="flex items-center gap-1 min-w-0">
          {/* Project chip — project rooms and project-assigned groups */}
          {room.project && (
            <span className="text-[0.7rem] px-1.5 py-px rounded-full truncate max-w-40 font-medium" style={{ background: room.project.light, color: room.project.accent }}>
              {room.project.title}
            </span>
          )}
          {/* DM: shared projects with this person */}
          {room.type === 'dm' &&
            ((room.other?.sharedProjects?.length ?? 0) > 0 ? (
              <>
                {room.other!.sharedProjects!.slice(0, 2).map((p) => (
                  <span key={p.id} className="text-[0.7rem] px-1.5 py-px rounded-full truncate max-w-32 font-medium" style={{ background: p.light, color: p.accent }}>
                    {p.title}
                  </span>
                ))}
                {room.other!.sharedProjects!.length > 2 && (
                  <span className="text-[0.7rem] opacity-60">+{room.other!.sharedProjects!.length - 2}</span>
                )}
              </>
            ) : (
              <span className="text-[0.7rem] opacity-50 truncate">{t('noSharedProject')}</span>
            ))}
          {/* Group: member count + owner */}
          {room.type === 'group' && (
            <span className="text-[0.7rem] opacity-60 truncate">
              {t('memberCount', { count: room.memberCount ?? 0 })}
              {room.owner ? ` · ${t('groupOwner', { name: room.owner })}` : ''}
            </span>
          )}
        </span>
      </span>
    </div>
  )
}
