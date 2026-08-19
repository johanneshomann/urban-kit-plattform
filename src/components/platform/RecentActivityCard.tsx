// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Newspaper, CalendarDays, MessageSquare, FileText, CheckSquare, BarChart2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ActivityItem, ActivityType } from '@/lib/project-activity'
import { relativeDay } from '@/lib/format-date'
import { AudienceChip } from '@/components/platform/AudienceChip'

const ICONS: Record<ActivityType, LucideIcon> = {
  news: Newspaper,
  event: CalendarDays,
  forum: MessageSquare,
  file: FileText,
  task: CheckSquare,
  poll: BarChart2,
}

/** "Aktivität zuletzt" card on the project overview — every row deep-links. */
export async function RecentActivityCard({ items, locale, base }: {
  items: ActivityItem[]
  locale: string
  /** Absolute workspace prefix (`/{locale}/dashboard/projekte/{slug}`) for the row links. */
  base: string
}) {
  const t = await getTranslations({ locale, namespace: 'projectWorkspace' })

  return (
    <div
      className="w-full rounded-xl p-4"
      style={{ background: 'var(--project-white)', border: '1.5px solid var(--project-light)', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
    >
      <h3 className="text-small font-semibold mb-3" style={{ color: 'var(--project-accent)' }}>{t('activityTitle')}</h3>

      {items.length === 0 ? (
        <p className="text-small" style={{ color: 'var(--project-ink)' }}>{t('activityEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item, i) => {
            // Fallback keeps the render alive if a new type ships without an icon.
            const Icon = ICONS[item.type] ?? FileText
            return (
              <li key={i}>
                <Link
                  href={`${base}${item.href}`}
                  className="group flex items-center gap-2.5 -mx-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-[color-mix(in_srgb,var(--project-general)_14%,transparent)]"
                >
                  <Icon aria-hidden="true" className="w-4 h-4 shrink-0" style={{ color: 'var(--project-ink)' }} />
                  <span className="min-w-0 flex-1 text-small font-medium line-clamp-1 group-hover:underline" style={{ color: 'var(--project-accent)' }}>{item.title}</span>
                  {item.visibility === 'TEAM' && <AudienceChip visibility={item.visibility} visibilityTeams={item.visibilityTeams} />}
                  <span className="text-small shrink-0" style={{ color: 'var(--project-ink)' }}>{relativeDay(item.date, locale)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
