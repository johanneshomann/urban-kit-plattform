// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  Download,
  MapPin,
  Newspaper,
  Tag,
} from 'lucide-react'
import { PublicModal } from '@/components/public/PublicModal'

export type AktuellesNewsPost = {
  id: string
  title: string
  slug: string
  publishedAt?: string | null
  /** Rendered post body — the popup is the only public reading surface. */
  contentHtml?: string | null
  imageUrl?: string | null
}

export type AktuellesCalEvent = {
  id: string
  title: string
  startDate: string
  endDate?: string | null
  allDay?: boolean | null
  location?: string | null
  category?: string | null
  /** Rendered event body — only visible via the popup (events have no subpage). */
  contentHtml?: string | null
}

type AktuellesSectionProps = {
  locale: string
  dateLocale: string
  slug: string
  /** News sorted newest-first. */
  posts: AktuellesNewsPost[]
  /** Upcoming events sorted ascending. */
  upcoming: AktuellesCalEvent[]
  /** Past events sorted descending (most recent first). */
  past: AktuellesCalEvent[]
}

// Pre-reveal we show three entries (same visual weight as the old preview).
// After reveal, more than eight entries turn the list into a scroll area.
const INITIAL_VISIBLE = 3
const SCROLL_THRESHOLD = 8
const SCROLL_MAX_HEIGHT = '60rem'

/**
 * Full news + event lists for the "Aktuelles" section of the public project
 * page. Both blocks share the gallery reveal pattern: three entries, then a
 * chevron + gradient fade once the list grows, and a scrollable container
 * after reveal when the list exceeds eight entries. Each block has its own
 * two-way sort toggle (news: newest/oldest, events: upcoming/past).
 */
export function AktuellesSection({
  locale,
  dateLocale,
  slug,
  posts,
  upcoming,
  past,
}: AktuellesSectionProps) {
  const t = useTranslations('projectDetail')

  const [newsSort, setNewsSort] = useState<'newest' | 'oldest'>('newest')
  const [eventsSort, setEventsSort] = useState<'upcoming' | 'past'>('upcoming')
  const [newsExpanded, setNewsExpanded] = useState(false)
  const [eventsExpanded, setEventsExpanded] = useState(false)
  const [openPost, setOpenPost] = useState<AktuellesNewsPost | null>(null)
  const [openEvent, setOpenEvent] = useState<AktuellesCalEvent | null>(null)

  const sortedPosts = useMemo(() => {
    if (newsSort === 'newest') return posts
    return [...posts].sort((a, b) =>
      (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''),
    )
  }, [posts, newsSort])

  // Both halves arrive correctly ordered; the toggle only changes the merge.
  const sortedEvents = useMemo(
    () => (eventsSort === 'upcoming' ? [...upcoming, ...past] : [...past, ...upcoming]),
    [upcoming, past, eventsSort],
  )

  const allPast = upcoming.length === 0 && past.length > 0
  const hasNews = sortedPosts.length > 0
  const hasEvents = sortedEvents.length > 0
  const twoColumns = hasNews && hasEvents

  const visiblePosts = newsExpanded ? sortedPosts : sortedPosts.slice(0, INITIAL_VISIBLE)
  const visibleEvents = eventsExpanded ? sortedEvents : sortedEvents.slice(0, INITIAL_VISIBLE)
  const newsScrollable = newsExpanded && sortedPosts.length > SCROLL_THRESHOLD
  const eventsScrollable = eventsExpanded && sortedEvents.length > SCROLL_THRESHOLD

  const formatDate = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString(dateLocale, {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null

  const revealLabel = (expanded: boolean) => (expanded ? t('showLess') : t('showMore'))

  const renderReveal = (
    expanded: boolean,
    toggle: () => void,
    listLength: number,
  ) => {
    if (listLength <= INITIAL_VISIBLE) return null
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-10 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to bottom, transparent, var(--plattform-light))',
            opacity: expanded ? 0 : 1,
            transition: 'opacity 0.35s ease',
          }}
        />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={revealLabel(expanded)}
          className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
          style={{ background: 'var(--plattform)', color: 'var(--plattform-white)' }}
        >
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </>
    )
  }

  return (
    <div className={`grid grid-cols-1 gap-12 items-start ${twoColumns ? 'lg:grid-cols-2' : ''}`}>
      {hasNews && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Newspaper className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
            <h3 className="text-display font-black tracking-tight">{t('newsHeading')}</h3>
            <button
              type="button"
              onClick={() => setNewsSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
              aria-pressed={newsSort === 'oldest'}
              title={newsSort === 'newest' ? t('sortOldest') : t('sortNewest')}
              className="ml-auto inline-flex items-center gap-1.5 text-small cursor-pointer hover:underline"
              style={{ color: 'var(--plattform-ink)' }}
            >
              <ArrowUpDown className="w-[1em] h-[1em] shrink-0" aria-hidden />
              {newsSort === 'newest' ? t('sortNewest') : t('sortOldest')}
            </button>
          </div>

          <div className="relative">
            <div
              className="flex flex-col gap-4"
              style={newsScrollable ? { maxHeight: SCROLL_MAX_HEIGHT, overflowY: 'auto', paddingRight: '0.25rem' } : undefined}
            >
              {visiblePosts.map((n, i) => (
                <div key={n.id} className="card-in" style={{ animationDelay: `${i * 60}ms` }}>
                  {/* Quick-read popup; the canonical subpage stays linked from within */}
                  <button
                    type="button"
                    onClick={() => setOpenPost(n)}
                    className="group flex items-center gap-5 w-full text-left bg-[var(--plattform-white)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Leading tile like the file cards: thumbnail or icon */}
                    {n.imageUrl ? (
                      <img src={n.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <span className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--plattform-light)' }}>
                        <Newspaper aria-hidden className="w-5 h-5" style={{ color: 'var(--plattform)' }} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      {n.publishedAt && (
                        <span className="block text-small mb-1.5" style={{ color: 'var(--plattform-ink)' }}>
                          {formatDate(n.publishedAt)}
                        </span>
                      )}
                      <span className="block text-text font-bold group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>
                        {n.title}
                      </span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
            {renderReveal(newsExpanded, () => setNewsExpanded((v) => !v), sortedPosts.length)}
          </div>
        </div>
      )}

      {hasEvents && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="w-[1.2em] h-[1.2em] shrink-0" style={{ color: 'var(--plattform)' }} />
            <h3 className="text-display font-black tracking-tight">
              {allPast ? t('termineVergangen') : t('termineHeading')}
            </h3>
            <button
              type="button"
              onClick={() => setEventsSort((s) => (s === 'upcoming' ? 'past' : 'upcoming'))}
              aria-pressed={eventsSort === 'past'}
              title={eventsSort === 'upcoming' ? t('sortPast') : t('sortUpcoming')}
              className="ml-auto inline-flex items-center gap-1.5 text-small cursor-pointer hover:underline"
              style={{ color: 'var(--plattform-ink)' }}
            >
              <ArrowUpDown className="w-[1em] h-[1em] shrink-0" aria-hidden />
              {eventsSort === 'upcoming' ? t('sortUpcoming') : t('sortPast')}
            </button>
          </div>

          <div className="relative">
            <div
              className="flex flex-col gap-4"
              style={eventsScrollable ? { maxHeight: SCROLL_MAX_HEIGHT, overflowY: 'auto', paddingRight: '0.25rem' } : undefined}
            >
              {visibleEvents.map((ev, i) => {
                const d = new Date(ev.startDate)
                const isPast = d < new Date()
                return (
                  <div
                    key={ev.id}
                    className="card-in flex items-center gap-5 bg-[var(--plattform-white)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div
                      className="shrink-0 w-16 rounded-lg py-2 text-center"
                      style={{ background: 'var(--plattform-light)', opacity: isPast ? 0.7 : 1 }}
                    >
                      <p className="text-display font-black leading-none" style={{ color: 'var(--plattform-ink-accent)' }}>
                        {d.toLocaleDateString(dateLocale, { day: '2-digit' })}
                      </p>
                      <p className="text-small uppercase tracking-widest" style={{ color: 'var(--plattform-ink)' }}>
                        {d.toLocaleDateString(dateLocale, { month: 'short' }).replace('.', '')}
                      </p>
                    </div>
                    {/* Details live in the popup — events have no subpage */}
                    <button type="button" onClick={() => setOpenEvent(ev)} className="group min-w-0 flex-1 text-left cursor-pointer">
                      <p className="text-text font-bold group-hover:underline" style={{ color: 'var(--plattform-ink-accent)' }}>
                        {ev.title}
                      </p>
                      <p className="text-small" style={{ color: 'var(--plattform-ink)' }}>
                        {d.toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {ev.location && (
                        <p className="flex items-center gap-1.5 text-small mt-1" style={{ color: 'var(--plattform-ink)' }}>
                          <MapPin className="w-[1em] h-[1em] shrink-0" />
                          {ev.location}
                        </p>
                      )}
                    </button>
                    {!isPast && (
                      <a
                        href={`/api/ics/event/${ev.id}`}
                        title={t('addToCalendar')}
                        className="shrink-0 p-2 rounded-lg transition-opacity opacity-60 hover:opacity-100"
                        style={{ color: 'var(--plattform-ink)' }}
                      >
                        <Download className="w-[1.1em] h-[1.1em] shrink-0" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
            {renderReveal(eventsExpanded, () => setEventsExpanded((v) => !v), sortedEvents.length)}
          </div>
        </div>
      )}

      {/* News popup — the only public reading surface (wide + scrollable) */}
      {openPost && (
        <PublicModal
          title={openPost.title}
          size="xl"
          leading={openPost.imageUrl
            ? <img src={openPost.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
            : undefined}
          onClose={() => setOpenPost(null)}
        >
          {openPost.publishedAt && (
            <p className="text-small mb-4" style={{ color: 'var(--plattform-ink)' }}>{formatDate(openPost.publishedAt)}</p>
          )}
          {openPost.contentHtml && (
            <div
              className="prose text-text leading-relaxed max-w-none"
              style={{ color: 'var(--plattform-ink)' }}
              dangerouslySetInnerHTML={{ __html: openPost.contentHtml }}
            />
          )}
        </PublicModal>
      )}

      {/* Event popup — the only public surface for event details */}
      {openEvent && (
        <PublicModal title={openEvent.title} onClose={() => setOpenEvent(null)}>
          <div className="flex flex-col gap-1.5 text-small" style={{ color: 'var(--plattform-ink)' }}>
            <p className="flex items-center gap-1.5">
              <CalendarDays aria-hidden className="w-[1em] h-[1em] shrink-0" />
              {new Date(openEvent.startDate).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {!openEvent.allDay && (
                <> · {new Date(openEvent.startDate).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                {openEvent.endDate && <>–{new Date(openEvent.endDate).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}</>} Uhr</>
              )}
            </p>
            {openEvent.location && (
              <p className="flex items-center gap-1.5"><MapPin aria-hidden className="w-[1em] h-[1em] shrink-0" />{openEvent.location}</p>
            )}
            {openEvent.category && (
              <p className="flex items-center gap-1.5"><Tag aria-hidden className="w-[1em] h-[1em] shrink-0" />{openEvent.category}</p>
            )}
          </div>
          {openEvent.contentHtml && (
            <div
              className="prose text-text leading-relaxed mt-4"
              style={{ color: 'var(--plattform-ink)' }}
              dangerouslySetInnerHTML={{ __html: openEvent.contentHtml }}
            />
          )}
          {new Date(openEvent.startDate) >= new Date() && (
            <a
              href={`/api/ics/event/${openEvent.id}`}
              className="mt-6 inline-flex items-center gap-1.5 text-small font-semibold hover:underline"
              style={{ color: 'var(--plattform)' }}
            >
              <Download aria-hidden className="w-4 h-4" /> {t('addToCalendar')}
            </a>
          )}
        </PublicModal>
      )}
    </div>
  )
}