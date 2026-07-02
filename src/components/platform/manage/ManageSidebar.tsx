'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Newspaper, CalendarDays, BarChart2, MessageSquare, CheckSquare,
  MessageCircle, Kanban, FolderOpen, Bot, Info, Palette, LayoutGrid, Users, UserPlus, Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MODULE_ICONS: Record<string, LucideIcon> = {
  news: Newspaper, calendar: CalendarDays, polls: BarChart2, forum: MessageSquare,
  tasks: CheckSquare, chat: MessageCircle, board: Kanban, files: FolderOpen, 'urban-agent': Bot,
}

const PROJEKT_ITEMS: { key: string; labelKey: string; icon: LucideIcon }[] = [
  { key: 'allgemein', labelKey: 'sidebar.general', icon: Info },
  { key: 'darstellung', labelKey: 'sidebar.appearance', icon: Palette },
  { key: 'module', labelKey: 'sidebar.modules', icon: LayoutGrid },
  { key: 'mitglieder', labelKey: 'sidebar.members', icon: Users },
  { key: 'anfragen', labelKey: 'sidebar.requests', icon: UserPlus },
  { key: 'einstellungen', labelKey: 'sidebar.settings', icon: Settings },
]

const base = 'flex items-center gap-2 px-3 py-2 rounded-lg text-small transition-colors w-full'

function NavLink({ href, label, icon: Icon, active, badge }: { href: string; label: string; icon: LucideIcon; active: boolean; badge?: number }) {
  const [hovered, setHovered] = useState(false)
  const bg = active ? 'var(--project-dark)' : hovered ? 'var(--project-mid)' : 'transparent'
  const color = active || hovered ? 'var(--project-white)' : 'var(--project-dark)'
  return (
    <Link
      href={href}
      className={base}
      style={{ background: bg, color }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span
          className="min-w-5 h-5 px-1.5 rounded-full text-[0.7rem] font-bold flex items-center justify-center shrink-0"
          style={{
            background: active || hovered ? 'var(--project-white)' : 'var(--project-dark)',
            color: active || hovered ? 'var(--project-dark)' : 'var(--project-white)',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--project-dark)', opacity: 0.45 }}>
      {children}
    </p>
  )
}

interface ManageSidebarProps {
  locale: string
  slug: string
  projectTitle: string
  enabledModules: string[]
  requestCount?: number
}

export function ManageSidebar({ locale, slug, projectTitle, enabledModules, requestCount = 0 }: ManageSidebarProps) {
  const t = useTranslations('manage')
  const tModules = useTranslations('modules')
  const pathname = usePathname()
  const manageBase = `/${locale}/dashboard/projekte/${slug}/manage`

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-60 shrink-0 flex flex-col min-h-screen border-r" style={{ background: 'var(--project-light)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>

      {/* Header — back to project */}
      <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
        <Link
          href={manageBase.replace('/manage', '')}
          className="flex items-center gap-2 text-small font-semibold min-w-0"
          style={{ color: 'var(--project-dark)' }}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="truncate">{projectTitle}</span>
        </Link>
      </div>

      <nav className="flex-1 py-2 px-2 flex flex-col gap-0.5 overflow-y-auto">
        <NavLink href={manageBase} label={t('sidebar.overview')} icon={LayoutGrid} active={isActive(manageBase, true)} />

        <GroupLabel>{t('sidebar.contentGroup')}</GroupLabel>
        {enabledModules.length === 0 && (
          <p className="px-3 py-1 text-small" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>{t('sidebar.noModules')}</p>
        )}
        {enabledModules.map((m) => {
          const href = `${manageBase}/inhalte/${m}`
          return <NavLink key={m} href={href} label={tModules(m)} icon={MODULE_ICONS[m] ?? FolderOpen} active={isActive(href)} />
        })}

        <GroupLabel>{t('sidebar.projectGroup')}</GroupLabel>
        {PROJEKT_ITEMS.map(({ key, labelKey, icon }) => {
          const href = `${manageBase}/${key}`
          return (
            <NavLink
              key={key}
              href={href}
              label={t(labelKey)}
              icon={icon}
              active={isActive(href)}
              badge={key === 'anfragen' ? requestCount : undefined}
            />
          )
        })}
      </nav>
    </aside>
  )
}
