'use client'

import { CalendarDays } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ModuleCardShell } from '@/components/platform/ModuleCardShell'

export interface CalendarCardEvent {
  id: string
  title: string
  startDate: string
  endDate?: string | null
  allDay?: boolean | null
}

function timeRange(ev: CalendarCardEvent, locale: string): string {
  if (ev.allDay) return ''
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  const start = new Date(ev.startDate).toLocaleTimeString(locale, opts)
  if (!ev.endDate) return start
  return `${start} – ${new Date(ev.endDate).toLocaleTimeString(locale, opts)}`
}

export function CalendarDashboardCard({ events, projectSlug, locale }: {
  events: CalendarCardEvent[]
  projectSlug: string
  locale: string
}) {
  const t = useTranslations('projectWorkspace')
  const base = `/${locale}/dashboard/projekte/${projectSlug}/m/calendar`

  return (
    <ModuleCardShell icon={CalendarDays} title="Kalender" href={base} ctaLabel={t('ctaAllEvents')}>
      {events.length === 0 ? (
        <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('emptyEvents')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((ev) => {
            const d = new Date(ev.startDate)
            const time = timeRange(ev, locale)
            return (
              <li key={ev.id} className="flex items-start gap-3">
                <span className="flex flex-col items-center leading-none shrink-0 rounded-md px-2 py-1" style={{ background: 'var(--project-light)' }}>
                  <span className="text-display font-bold" style={{ color: 'var(--project-dark)' }}>{d.toLocaleDateString(locale, { day: 'numeric' })}</span>
                  <span className="text-small uppercase" style={{ color: 'var(--project-mid)' }}>{d.toLocaleDateString(locale, { month: 'short' })}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-small font-medium leading-snug line-clamp-1" style={{ color: 'var(--project-dark)' }}>{ev.title}</span>
                  {time && <span className="block text-small" style={{ color: 'var(--project-mid)' }}>{time} Uhr</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </ModuleCardShell>
  )
}
