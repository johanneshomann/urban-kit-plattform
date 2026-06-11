import Link from 'next/link'
import { Bot, ChevronRight } from 'lucide-react'

const P = {
  white: 'var(--project-white)',
  light: 'var(--project-light)',
  mid:   'var(--project-mid)',
  dark:  'var(--project-dark)',
} as const

export function UrbanAgentDashboardCard({ projectSlug, locale }: {
  projectSlug: string; locale: string
}) {
  return (
    <div className="h-full flex flex-col" style={{ background: P.white }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="text-display rounded-lg flex items-center justify-center shrink-0 p-2" style={{ background: P.light }}>
            <Bot className="w-[1em] h-[1em]" style={{ color: P.dark }} />
          </div>
          <span className="text-display font-semibold" style={{ color: P.dark }}>Urban Agent</span>
        </div>
        <Link href={`/${locale}/dashboard/projekte/${projectSlug}/m/urban-agent`} className="text-small flex items-center gap-0.5 transition-opacity opacity-40 hover:opacity-80" style={{ color: P.dark }}>
          Öffnen <ChevronRight className="w-[0.85em] h-[0.85em]" />
        </Link>
      </div>
      <div className="px-5 pb-5 flex-1">
        <p className="text-small" style={{ color: P.mid }}>KI-gestützte Beteiligung</p>
      </div>
    </div>
  )
}
