import Link from 'next/link'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'

const P = {
  white:  'var(--project-white)',
  light:  'var(--project-light)',
  mid:    'var(--project-mid)',
  dark:   'var(--project-dark)',
} as const

interface CalEvent {
  id: string
  title: string
  startDate: string
  location?: string | null
}

export function CalendarDashboardCard({
  events, projectSlug, locale,
}: {
  events: CalEvent[]
  projectSlug: string
  locale: string
}) {
  return (
    <div
      className="h-full flex flex-col"
      style={{ background: P.white }}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="text-display rounded-lg flex items-center justify-center shrink-0 p-2" style={{ background: P.light }}>
            <CalendarDays className="w-[1em] h-[1em]" style={{ color: P.dark }} />
          </div>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <span className="text-display font-semibold" style={{ color: P.dark }}>Kalender</span>
            {events.length > 0 && (
              <span style={{ position: 'absolute', top: '-0.3rem', right: '-0.3rem', background: 'var(--project-accent)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '0.25em 0.5em', borderRadius: '999px', lineHeight: 1, minWidth: '1.5em', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {events.length}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/${locale}/dashboard/projekte/${projectSlug}/m/calendar`}
          className="text-small flex items-center gap-0.5 transition-opacity opacity-40 hover:opacity-80"
          style={{ color: P.dark }}
        >
          Öffnen <ChevronRight className="w-[0.85em] h-[0.85em]" />
        </Link>
      </div>
      <div className="px-5 pb-5 flex-1">
        {events.length === 0 ? (
          <p className="text-small" style={{ color: P.mid }}>
            Keine bevorstehenden Termine
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3 items-start">
                <div className="shrink-0 w-10 text-center rounded-lg py-1.5" style={{ background: P.light }}>
                  <span className="font-bold block leading-none" style={{ color: P.dark, fontSize: '1rem' }}>
                    {new Date(event.startDate).getDate()}
                  </span>
                  <span className="block mt-0.5" style={{ color: P.mid, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {new Date(event.startDate).toLocaleDateString('de-DE', { month: 'short' })}
                  </span>
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-small font-medium line-clamp-1" style={{ color: P.dark }}>{event.title}</p>
                  {event.location && (
                    <p className="text-small flex items-center gap-0.5 mt-0.5" style={{ color: P.mid, opacity: 0.7 }}>
                      <MapPin className="w-[0.75em] h-[0.75em] shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
