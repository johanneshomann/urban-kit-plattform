import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Newspaper, CalendarDays, MessageSquare, FileText, CheckSquare, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ActivityItem, ActivityType } from '@/lib/project-activity'
import { relativeDay } from '@/lib/format-date'

const ICONS: Record<ActivityType, LucideIcon> = {
  news: Newspaper,
  event: CalendarDays,
  forum: MessageSquare,
  file: FileText,
  task: CheckSquare,
}

/** Floating "Aktivität zuletzt" card shown over the hero. */
export async function RecentActivityCard({ items, locale, moreHref }: {
  items: ActivityItem[]
  locale: string
  moreHref: string
}) {
  const t = await getTranslations({ locale, namespace: 'projectWorkspace' })

  return (
    <div
      className="w-full max-w-xs rounded-xl p-4 backdrop-blur"
      style={{ background: 'color-mix(in srgb, var(--project-white) 92%, transparent)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}
    >
      <h3 className="text-small font-semibold mb-3" style={{ color: 'var(--project-dark)' }}>{t('activityTitle')}</h3>

      {items.length === 0 ? (
        <p className="text-small" style={{ color: 'var(--project-mid)' }}>{t('activityEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item, i) => {
            const Icon = ICONS[item.type]
            return (
              <li key={i} className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--project-mid)' }} />
                <span className="min-w-0 flex-1 text-small font-medium line-clamp-1" style={{ color: 'var(--project-dark)' }}>{item.title}</span>
                <span className="text-small shrink-0" style={{ color: 'var(--project-mid)' }}>{relativeDay(item.date, locale)}</span>
              </li>
            )
          })}
        </ul>
      )}

      <Link href={moreHref} className="mt-3 inline-flex items-center gap-1 text-small font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--project-accent)' }}>
        {t('activityMore')} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
