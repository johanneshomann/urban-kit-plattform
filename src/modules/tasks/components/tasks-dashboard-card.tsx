import Link from 'next/link'
import { CheckSquare, ChevronRight } from 'lucide-react'

const P = {
  white: 'var(--project-white)',
  light: 'var(--project-light)',
  mid:   'var(--project-mid)',
  dark:  'var(--project-dark)',
} as const

export function TasksDashboardCard({ count, projectSlug, locale }: {
  count: number; projectSlug: string; locale: string
}) {
  const subtitle = count === 0
    ? 'Keine Aufgaben'
    : `${count} ${count === 1 ? 'Aufgabe' : 'Aufgaben'}`

  return (
    <div className="h-full flex flex-col" style={{ background: P.white }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="text-display rounded-lg flex items-center justify-center shrink-0 p-2" style={{ background: P.light }}>
              <CheckSquare className="w-[1em] h-[1em]" style={{ color: P.dark }} />
            </div>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <span className="text-display font-semibold" style={{ color: P.dark }}>Aufgaben</span>
            {count > 0 && (
              <span style={{ position: 'absolute', top: '-0.3rem', right: '-0.3rem', background: 'var(--project-accent)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '0.25em 0.5em', borderRadius: '999px', lineHeight: 1, minWidth: '1.5em', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {count}
              </span>
            )}
          </div>
        </div>
        <Link href={`/${locale}/dashboard/projekte/${projectSlug}/m/tasks`} className="text-small flex items-center gap-0.5 transition-opacity opacity-40 hover:opacity-80" style={{ color: P.dark }}>
          Öffnen <ChevronRight className="w-[0.85em] h-[0.85em]" />
        </Link>
      </div>
      <div className="px-5 pb-5 flex-1">
        <p className="text-small" style={{ color: P.mid }}>{subtitle}</p>
      </div>
    </div>
  )
}
