// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft, Newspaper, CalendarDays, BarChart2, MessageSquare, CheckSquare,
  Kanban, FolderOpen, Bot, Info, Palette, LayoutGrid, Users,
  UserPlus, Settings, Settings2, Shield,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const MODULE_ICONS: Record<string, LucideIcon> = {
  news: Newspaper, calendar: CalendarDays, polls: BarChart2, forum: MessageSquare,
  tasks: CheckSquare, board: Kanban, files: FolderOpen, 'urban-agent': Bot,
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
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-small w-full transition-colors hover:bg-[color-mix(in_srgb,var(--project-general)_18%,transparent)]"
      style={active ? { background: 'var(--project-accent)', color: 'var(--project-white)' } : { color: 'var(--project-accent)' }}
    >
      {/* Active state is background + indicator bar, not color alone (WCAG
          1.4.1) — the bar is white so it stays visible on the accent bg. */}
      {active && (
        <span aria-hidden="true" className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full" style={{ background: 'var(--project-white)' }} />
      )}
      <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <>
          <span
            aria-hidden="true"
            className="min-w-5 h-5 px-1.5 rounded-full text-[0.7rem] font-bold flex items-center justify-center shrink-0"
            style={active
              ? { background: 'var(--project-white)', color: 'var(--project-accent)' }
              : { background: 'var(--project-accent)', color: 'var(--project-white)' }}
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
    <p className="px-3 pt-4 pb-1 text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--project-ink)' }}>
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

  // Manage mode inverts the sidebar with the EXISTING scheme tokens: the aside
  // paints the original accent as background (captured into --mi-* before the
  // swap), and inside it accent ↔ white trade places, so every child — nav
  // links, active pill, badges, user bar — inverts using the already-gated
  // contrast pairs (white on accent / accent on white). No new colors.
  const manageInvert = manageMode
    ? ({
        '--mi-accent': 'var(--project-accent)',
        '--mi-white': 'var(--project-white)',
      } as React.CSSProperties)
    : undefined
  const manageSwap = manageMode
    ? ({
        '--project-accent': 'var(--mi-white)',
        '--project-white': 'var(--mi-accent)',
        // GroupLabel text: muted ink is not gated on the dark accent — use white.
        '--project-ink': 'var(--mi-white)',
      } as React.CSSProperties)
    : undefined

  return (
    <aside
      className="hidden lg:flex w-[16.5rem] shrink-0 flex-col sticky top-0 h-svh border-r"
      style={{
        background: manageMode ? 'var(--project-accent)' : 'var(--project-light)',
        borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)',
        ...manageInvert,
      }}
    >
    <div className="flex-1 min-h-0 flex flex-col" style={manageSwap}>
      {/* Project identity — title overlaid on the cover image (dark scrim keeps
          the white text readable on any cover) */}
      <div className="shrink-0 border-b" style={{ borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
        <div className="relative">
          <Link href={root} className="block">
            <img src={coverSrc} alt="" className="h-28 w-full object-cover" />
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.15) 55%, transparent)' }}
            />
            <span className="absolute inset-x-0 bottom-0 px-4 pb-2.5 text-white">
              {manageMode && (
                <span className="block text-[0.7rem] font-bold uppercase tracking-widest opacity-80">
                  {tm('sidebar.title')}
                </span>
              )}
              <span className="block font-semibold leading-snug line-clamp-2">{projectTitle}</span>
            </span>
          </Link>
          {/* One step back — to the project in manage mode, to the dashboard
              otherwise. Sibling of the cover link (links must not nest). */}
          <Link
            href={manageMode ? root : `/${locale}/dashboard`}
            aria-label={manageMode ? tm('sidebar.backToProject') : tw('backToDashboard')}
            className="absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <nav aria-label={tw('sidebarNavLabel')} className="flex-1 py-2 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {manageMode ? (
          <>
            <NavLink href={manageBase} label={tm('sidebar.overview')} icon={LayoutGrid} active={isActive(manageBase, true)} />

            <GroupLabel>{tm('sidebar.contentGroup')}</GroupLabel>
            {manageModules.length === 0 && (
              <p className="px-3 py-1 text-small" style={{ color: 'var(--project-ink)' }}>{tm('sidebar.noModules')}</p>
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
            {/* Flat module list (no Mitmachen/Zusammenarbeiten groups) — the
                concat keeps MODULE_ORDER since participate precedes collaborate. */}
            <NavLink href={root} label={tw('overview')} icon={LayoutGrid} active={isActive(root, true)} />
            {[...participate, ...collaborate].map((m) => (
              <NavLink key={m} href={`${root}/m/${m}`} label={tModules(m)} icon={MODULE_ICONS[m] ?? FolderOpen} active={isActive(`${root}/m/${m}`)} />
            ))}

            {/* Über das Projekt sits last, set off by a divider */}
            <div
              aria-hidden="true"
              className="my-2 border-t"
              style={{ borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}
            />
            <NavLink href={`${root}/info`} label={tw('aboutProject')} icon={Info} active={isActive(`${root}/info`)} />
          </>
        )}
      </nav>

      {canManage && !manageMode && (
        <div className="shrink-0 border-t p-2" style={{ borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
          <NavLink href={manageBase} label={tw('manage')} icon={Settings2} active={false} />
        </div>
      )}
    </div>
    </aside>
  )
}
