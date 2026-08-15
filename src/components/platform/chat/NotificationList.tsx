// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { UserPlus, CheckSquare, BarChart2, Newspaper, Users, BellRing, Trash2, X, type LucideIcon } from 'lucide-react'
import { useRelativeTime } from './useRelativeTime'
import type { NotificationItem } from './useNotifications'

const TYPE_ICONS: Record<string, LucideIcon> = {
  invited: UserPlus,
  task_assigned: CheckSquare,
  poll_closed: BarChart2,
  join_request: UserPlus,
  new_content: Newspaper,
  member_joined: Users,
}

/**
 * The launcher's Mitteilungen tab: latest notifications with resolved
 * reference titles and deep links; unread rows carry an accent dot. Viewing
 * the tab marks everything read (launcher calls markAllRead), but the rows
 * keep this render's unread highlight so new items remain scannable.
 */
export function NotificationList({
  items,
  loading,
  onChanged,
}: {
  items: NotificationItem[]
  loading: boolean
  onChanged: () => void
}) {
  const t = useTranslations('notifications')
  const locale = useLocale()
  const relTime = useRelativeTime()

  const remove = async (body: { ids?: string[]; all?: true }) => {
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
    onChanged()
  }

  const text = (item: NotificationItem): string => {
    const title = item.title ?? t('missingRef')
    switch (item.type) {
      case 'invited': return t('typeInvited', { title })
      case 'task_assigned': return t('typeTaskAssigned', { title })
      case 'poll_closed': return t('typePollClosed', { title })
      case 'join_request': return t('typeJoinRequest', { title })
      case 'new_content': return t('typeNewContent', { title })
      case 'member_joined': return t('typeMemberJoined', { title })
      default: return title
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {items.length > 0 && (
        <div className="shrink-0 flex justify-end px-3 pt-2">
          <button
            type="button"
            onClick={() => void remove({ all: true })}
            className="inline-flex items-center gap-1 text-small opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--project-ink, var(--app-ink))' }}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {t('deleteAll')}
          </button>
        </div>
      )}
      <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5 p-3 pt-1" role="list">
        {items.length === 0 && (
          <li className="m-auto text-small opacity-50 py-8 flex flex-col items-center gap-2">
            <BellRing className="h-5 w-5 opacity-60" aria-hidden />
            {loading ? '…' : t('empty')}
          </li>
        )}
        {items.map((item, i) => {
          const Icon = TYPE_ICONS[item.type] ?? BellRing
          const body = (
            <>
              <span aria-hidden className="relative shrink-0 mt-0.5" style={{ color: 'var(--project-accent, var(--app-accent))' }}>
                <Icon className="h-4 w-4" />
                {!item.read && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--project-accent,var(--app-accent))]" />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-small leading-snug ${item.read ? '' : 'font-semibold'}`} style={{ color: 'var(--project-ink, var(--app-ink))' }}>
                  {text(item)}
                </span>
                <span className="block text-[0.7rem] opacity-50 mt-0.5">{relTime(item.createdAt)}</span>
              </span>
            </>
          )
          const rowClass =
            'flex-1 min-w-0 flex items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_6%,transparent)]'
          return (
            <li key={item.id} className="group/notif flex items-start card-in" style={{ animationDelay: `${Math.min(i * 25, 200)}ms` }}>
              {item.href ? (
                <Link href={`/${locale}${item.href}`} className={rowClass}>
                  {body}
                </Link>
              ) : (
                <div className={rowClass}>{body}</div>
              )}
              <button
                type="button"
                onClick={() => void remove({ ids: [item.id] })}
                aria-label={t('delete')}
                className="shrink-0 p-1.5 mt-1.5 rounded-md opacity-0 group-hover/notif:opacity-50 focus-visible:opacity-50 hover:!opacity-100 cursor-pointer transition-opacity"
                style={{ color: 'var(--project-ink, var(--app-ink))' }}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
