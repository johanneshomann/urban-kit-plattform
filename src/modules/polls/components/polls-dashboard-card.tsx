import Link from 'next/link'
import { BarChart2, ChevronRight } from 'lucide-react'

const P = {
  white: 'var(--project-white)',
  light: 'var(--project-light)',
  mid:   'var(--project-mid)',
  dark:  'var(--project-dark)',
} as const

export function PollsDashboardCard({ polls, projectSlug, locale }: {
  polls: { id: string; title: string }[]
  projectSlug: string
  locale: string
}) {
  return (
    <div className="h-full flex flex-col" style={{ background: P.white }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="text-display rounded-lg flex items-center justify-center shrink-0 p-2" style={{ background: P.light }}>
            <BarChart2 className="w-[1em] h-[1em]" style={{ color: P.dark }} />
          </div>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <span className="text-display font-semibold" style={{ color: P.dark }}>Umfragen</span>
            {polls.length > 0 && (
              <span style={{ position: 'absolute', top: '-0.3rem', right: '-0.3rem', background: 'var(--project-accent)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '0.25em 0.5em', borderRadius: '999px', lineHeight: 1, minWidth: '1.5em', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {polls.length}
              </span>
            )}
          </div>
        </div>
        <Link href={`/${locale}/dashboard/projekte/${projectSlug}/m/polls`} className="text-small flex items-center gap-0.5 transition-opacity opacity-40 hover:opacity-80" style={{ color: P.dark }}>
          Öffnen <ChevronRight className="w-[0.85em] h-[0.85em]" />
        </Link>
      </div>
      <div className="px-5 pb-5 flex-1">
        {polls.length === 0 ? (
          <p className="text-small" style={{ color: P.mid }}>Keine aktiven Umfragen</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {polls.map((poll) => (
              <li key={poll.id}>
                <Link
                  href={`/${locale}/dashboard/projekte/${projectSlug}/m/polls/${poll.id}`}
                  className="text-small block leading-snug transition-opacity opacity-70 hover:opacity-100"
                  style={{ color: P.dark }}
                >
                  {poll.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
