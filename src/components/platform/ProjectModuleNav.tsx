import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import {
  LayoutDashboard,
  Newspaper, CalendarDays, BarChart2, MessageSquare,
  CheckSquare, MessageCircle, Kanban, FolderOpen, Bot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MODULE_ICONS: Record<string, LucideIcon> = {
  news:          Newspaper,
  calendar:      CalendarDays,
  polls:         BarChart2,
  forum:         MessageSquare,
  tasks:         CheckSquare,
  chat:          MessageCircle,
  board:         Kanban,
  files:         FolderOpen,
  'urban-agent': Bot,
}

const P = {
  white: 'var(--project-white)',
  light: 'var(--project-light)',
  mid:   'var(--project-mid)',
  dark:  'var(--project-dark)',
} as const

interface ProjectModuleNavProps {
  modules: string[]
  slug: string
  locale: string
  activeModule?: string | null
}

export async function ProjectModuleNav({ modules, slug, locale, activeModule }: ProjectModuleNavProps) {
  const [t, tm] = await Promise.all([
    getTranslations({ locale, namespace: 'projectWorkspace' }),
    getTranslations({ locale, namespace: 'modules' }),
  ])
  const overviewActive = !activeModule

  return (
    <div
      className="sticky top-14 z-40 flex items-center gap-0.5 px-5 py-2 overflow-x-auto border-b"
      style={{ background: P.white, borderColor: P.light }}
    >
      {/* Übersicht */}
      <Link
        href={`/${locale}/dashboard/projekte/${slug}`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-small font-medium whitespace-nowrap transition-colors"
        style={{
          color: P.dark,
          background: overviewActive ? P.light : 'transparent',
        }}
      >
        <LayoutDashboard className="w-[0.9em] h-[0.9em] shrink-0" />
        <span className="max-sm:hidden">{t('overview')}</span>
      </Link>

      {/* Module links */}
      {modules.map((moduleId) => {
        const Icon = MODULE_ICONS[moduleId]
        if (!Icon) return null
        const label = tm(moduleId)
        const isActive = activeModule === moduleId

        return (
          <Link
            key={moduleId}
            href={`/${locale}/dashboard/projekte/${slug}/m/${moduleId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-small font-medium whitespace-nowrap transition-colors"
            style={{
              color: P.dark,
              background: isActive ? P.light : 'transparent',
            }}
          >
            <Icon className="w-[0.9em] h-[0.9em] shrink-0" />
            <span className="max-sm:hidden">{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
