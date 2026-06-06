import Link from 'next/link'

interface CalEvent { id: string; title: string; startDate: string; location?: string }

export function CalendarDashboardCard({ events, projectSlug, locale }: {
  events: CalEvent[]
  projectSlug: string
  locale: string
}) {
  const upcoming = events
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Kalender</h3>
        <Link href={`/${locale}/platform/dashboard/projekte/${projectSlug}/m/calendar`} className="text-xs text-blue-600 hover:underline">
          Alle →
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-xs text-gray-400">Keine bevorstehenden Termine</p>
      ) : (
        <ul className="space-y-1">
          {upcoming.slice(0, 3).map((e) => (
            <li key={e.id} className="text-sm">
              <span className="text-gray-400 mr-2">
                {new Date(e.startDate).toLocaleDateString('de-DE')}
              </span>
              {e.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
