'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Newspaper, CalendarDays, BarChart2, MessageSquare, CheckSquare,
  MessageCircle, Kanban, FolderOpen, Bot, Info, Palette, LayoutGrid, Users,
  UserPlus, Settings, Settings2, Shield,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SidebarUserBar } from '@/components/platform/SidebarUserBar'

export const MODULE_ICONS: Record<string, LucideIcon> = {
  news: Newspaper, calendar: CalendarDays, polls: BarChart2, forum: MessageSquare,
  tasks: CheckSquare, chat: MessageCircle, board: Kanban, files: FolderOpen, 'urban-agent': Bot,
}

export const MANAGE_PROJECT_ITEMS: { key: string; labelKey: string; icon: LucideIcon }[] = [
  { key: 'allgemein', labelKey: 'sidebar.general', icon: Info },
  { key: 'teams', labelKey: 'sidebar.teams', icon: Shield },
  { key: 'darstellung', labelKey: 'sidebar.appearance', icon: Palette },
  { key: 'module', labelKey: 'sidebar.modules', icon: LayoutGrid },
  { key: 'mitglieder', labelKey: 'sidebar.members', icon: Users },
  { key: 'anfragen', labelKey: 'sidebar.requests', icon: UserPlus },
  { key: 'einstellungen', labelKey: 'sidebar.settings', icon: Settings },
]

function NavLink({ href, label, icon: Icon, active, badge, badgeSr }: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  badge?: number
  badgeSr?: string
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-small w-full transition-colors hover:bg-[color-mix(in_srgb,var(--project-mid)_18%,transparent)]"
      style={active ? { background: 'var(--project-dark)', color: 'var(--project-white)' } : { color: 'var(--project-dark)' }}
    >
      {/* Active state is background + indicator bar, not color alone (WCAG 1.4.1) */}
      {active && (
        <span aria-hidden="true" className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full" style={{ background: 'var(--project-accent)' }} />
      )}
      <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <>
          <span
            aria-hidden="true"
            className="min-w-5 h-5 px-1.5 rounded-full text-[0.7rem] font-bold flex items-center justify-center shrink-0"
            style={active
              ? { background: 'var(--project-white)', color: 'var(--project-dark)' }
              : { background: 'var(--project-dark)', color: 'var(--project-white)' }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
          {badgeSr && <span className="sr-only">{badgeSr}</span>}
        </>
      )}
    </Link>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
      {children}
    </p>
  )
}

export interface ProjectSidebarProps {
  locale: string
  slug: string
  projectTitle: string
  coverSrc: string
  /** Enabled participation modules, in MODULE_ORDER. */
  participate: string[]
  /** Enabled collaboration modules — empty unless the viewer is an active member. */
  collaborate: string[]
  /** Enabled modules with a manage surface — empty unless the viewer is a PM. */
  manageModules: string[]
  canManage: boolean
  requestCount: number
}

/**
 * Persistent project navigation for the whole `[slug]` subtree, desktop only
 * (`ProjectTabBar` covers < lg). Two modes derived from the pathname: the
 * citizen workspace and — for PMs on `/manage` routes — the manage area.
 * Since the logged-in area has no header bar, this also carries the account
 * controls (`SidebarUserBar`) at its foot.
 *
 * The module lists are presentation only; access is enforced server-side by
 * the manage layout guard and each module page's own checks.
 */
export function ProjectSidebar({
  locale, slug, projectTitle, coverSrc, participate, collaborate, manageModules, canManage, requestCount,
}: ProjectSidebarProps) {
  const tw = useTranslations('projectWorkspace')
  const tm = useTranslations('manage')
  const tModules = useTranslations('modules')
  const pathname = usePathname()

  const root = `/${locale}/dashboard/projekte/${slug}`
  const manageBase = `${root}/manage`
  const manageMode = pathname === manageBase || pathname.startsWith(manageBase + '/')

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  // Shift the fixed a11y FAB clear of the sidebar (globals.css keys on this).
  useEffect(() => {
    document.documentElement.classList.add('has-project-sidebar')
    return () => document.documentElement.classList.remove('has-project-sidebar')
  }, [])

  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 flex-col sticky top-0 h-svh border-r"
      style={{ background: 'var(--project-light)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}
    >
      {/* Project identity — cover image, then title */}
      <div className="shrink-0">
        <Link href={root} className="block" aria-label={projectTitle}>
          <img src={coverSrc} alt="" className="h-24 w-full object-cover" />
        </Link>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
          {manageMode ? (
            <Link href={root} className="flex items-center gap-2 text-small font-semibold min-w-0" style={{ color: 'var(--project-dark)' }}>
              <ArrowLeft aria-hidden="true" className="w-4 h-4 shrink-0" />
              <span className="truncate">{tm('sidebar.backToProject')}</span>
            </Link>
          ) : (
            <p className="font-semibold leading-snug line-clamp-2" style={{ color: 'var(--project-dark)' }}>{projectTitle}</p>
          )}
        </div>
      </div>

      <nav aria-label={tw('sidebarNavLabel')} className="flex-1 py-2 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {manageMode ? (
          <>
            <NavLink href={manageBase} label={tm('sidebar.overview')} icon={LayoutGrid} active={isActive(manageBase, true)} />

            <GroupLabel>{tm('sidebar.contentGroup')}</GroupLabel>
            {manageModules.length === 0 && (
              <p className="px-3 py-1 text-small" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{tm('sidebar.noModules')}</p>
            )}
            {manageModules.map((m) => (
              <NavLink key={m} href={`${manageBase}/inhalte/${m}`} label={tModules(m)} icon={MODULE_ICONS[m] ?? FolderOpen} active={isActive(`${manageBase}/inhalte/${m}`)} />
            ))}

            <GroupLabel>{tm('sidebar.projectGroup')}</GroupLabel>
            {MANAGE_PROJECT_ITEMS.map(({ key, labelKey, icon }) => (
              <NavLink
                key={key}
                href={`${manageBase}/${key}`}
                label={tm(labelKey)}
                icon={icon}
                active={isActive(`${manageBase}/${key}`)}
                badge={key === 'anfragen' ? requestCount : undefined}
                badgeSr={key === 'anfragen' ? tm('sidebar.requestsBadge', { count: requestCount }) : undefined}
              />
            ))}
          </>
        ) : (
          <>
            <NavLink href={root} label={tw('overview')} icon={LayoutGrid} active={isActive(root, true)} />
            <NavLink href={`${root}/info`} label={tw('aboutProject')} icon={Info} active={isActive(`${root}/info`)} />

            <GroupLabel>{tw('sectionParticipate')}</GroupLabel>
            {participate.map((m) => (
              <NavLink key={m} href={`${root}/m/${m}`} label={tModules(m)} icon={MODULE_ICONS[m] ?? FolderOpen} active={isActive(`${root}/m/${m}`)} />
            ))}

            {collaborate.length > 0 && (
              <>
                <GroupLabel>{tw('sectionCollaborate')}</GroupLabel>
                {collaborate.map((m) => (
                  <NavLink key={m} href={`${root}/m/${m}`} label={tModules(m)} icon={MODULE_ICONS[m] ?? FolderOpen} active={isActive(`${root}/m/${m}`)} />
                ))}
              </>
            )}
          </>
        )}
      </nav>

      <div className="shrink-0 border-t p-2 flex flex-col gap-1" style={{ borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }}>
        {canManage && !manageMode && (
          <NavLink href={manageBase} label={tw('manage')} icon={Settings2} active={false} />
        )}
        <SidebarUserBar className="px-1" />
      </div>
    </aside>
  )
}
