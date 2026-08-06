'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BarChart2, Calendar, Newspaper, ChevronRight } from 'lucide-react'

export type NotificationItem = {
  type: 'poll' | 'event' | 'news'
  title: string
  projectTitle: string
  projectSlug: string
  date?: string
  schemeGeneral: string
  schemeAccent: string
  schemeLight: string
  schemeDark: string
}

const typeIcon = {
  poll: BarChart2,
  event: Calendar,
  news: Newspaper,
}

const INK = 'var(--project-accent, var(--plattform-ink))'
const MUTED = 'var(--project-ink, var(--plattform-ink))'

/** Activity feed for the platform dock's "Aktivitäten" tab. */
export function NotificationList({ locale, items, onNavigate }: {
  locale: string
  items: NotificationItem[]
  onNavigate?: () => void
}) {
  const t = useTranslations('platform')

  const typeLabel: Record<NotificationItem['type'], string> = {
    poll: t('notifPoll'),
    event: t('notifEvent'),
    news: t('notifNews'),
  }

  const formatDate = (dateStr: string): string => {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days === 0) return t('dateToday')
    if (days === 1) return t('dateTomorrow')
    if (days > 1 && days <= 7) return t('dateInDays', { days })
    const diff = Date.now() - new Date(dateStr).getTime()
    const ago = Math.floor(diff / (1000 * 60 * 60))
    if (ago < 1) return t('dateJustNow')
    if (ago < 24) return t('dateHoursAgo', { hours: ago })
    const days2 = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days2 === 1) return t('dateYesterday')
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short' })
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 min-h-0 px-4 py-8 text-center">
        <p className="text-small" style={{ color: MUTED }}>{t('notifEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {items.map((item, i) => {
        const Icon = typeIcon[item.type]
        return (
          <Link
            key={i}
            href={`/${locale}/dashboard/projekte/${item.projectSlug}`}
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5 border-b last:border-0"
            style={{ borderColor: 'var(--project-light, #e5e7eb)' }}
          >
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: item.schemeGeneral }} />
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.schemeLight }}>
              <Icon aria-hidden="true" className="w-3.5 h-3.5" style={{ color: item.schemeAccent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-small font-medium truncate" style={{ color: INK }}>{item.title}</p>
              <p className="text-small truncate" style={{ color: MUTED }}>
                {item.projectTitle} · {typeLabel[item.type]}
              </p>
            </div>
            {item.date && (
              <span className="text-small shrink-0" style={{ color: MUTED }}>{formatDate(item.date)}</span>
            )}
            <ChevronRight aria-hidden="true" className="w-3.5 h-3.5 shrink-0 opacity-30" />
          </Link>
        )
      })}
    </div>
  )
}
