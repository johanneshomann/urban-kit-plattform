// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeft, LayoutGrid, MoreHorizontal, Info, Settings2, FolderOpen, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MODULE_ICONS, MANAGE_PROJECT_ITEMS } from '@/components/platform/ProjectSidebar'

const SHEET_ID = 'project-tabbar-sheet'
/** Übersicht + up to 3 modules + Mehr = max 5 tab slots. */
const DIRECT_TABS = 3

interface SheetItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
  badgeSr?: string
}

/**
 * Mobile counterpart of `ProjectSidebar` (< lg): fixed bottom tab bar with the
 * overview, the first modules and a "Mehr" sheet holding the remaining
 * navigation. Mirrors the sidebar's two modes — citizen workspace and, on
 * `/manage` routes, the PM manage area. Like the sidebar this is presentation
 * only — access is enforced server-side. The bar sits at z-30 below the sticky
 * header and the a11y FAB (z-40/z-50); the open sheet overlays both at z-50.
 */
export function ProjectTabBar({ locale, slug, participate, collaborate, manageModules, canManage, requestCount }: {
  locale: string
  slug: string
  participate: string[]
  collaborate: string[]
  manageModules: string[]
  canManage: boolean
  requestCount: number
}) {
  const tw = useTranslations('projectWorkspace')
  const tm = useTranslations('manage')
  const tModules = useTranslations('modules')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const root = `/${locale}/dashboard/projekte/${slug}`
  const manageBase = `${root}/manage`
  const manageMode = pathname === manageBase || pathname.startsWith(manageBase + '/')
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const overviewHref = manageMode ? manageBase : root
  const directModules = (manageMode ? manageModules : participate).slice(0, DIRECT_TABS)
  const moduleHref = (m: string) => manageMode ? `${manageBase}/inhalte/${m}` : `${root}/m/${m}`

  const sheetItems: SheetItem[] = manageMode
    ? [
        ...manageModules.slice(DIRECT_TABS).map((m) => ({ href: moduleHref(m), label: tModules(m), icon: MODULE_ICONS[m] ?? FolderOpen })),
        ...MANAGE_PROJECT_ITEMS.map(({ key, labelKey, icon }) => ({
          href: `${manageBase}/${key}`,
          label: tm(labelKey),
          icon,
          badge: key === 'anfragen' ? requestCount : undefined,
          badgeSr: key === 'anfragen' ? tm('sidebar.requestsBadge', { count: requestCount }) : undefined,
        })),
        { href: root, label: tm('sidebar.backToProject'), icon: ArrowLeft },
      ]
    : [
        ...participate.slice(DIRECT_TABS).map((m) => ({ href: moduleHref(m), label: tModules(m), icon: MODULE_ICONS[m] ?? FolderOpen })),
        ...collaborate.map((m) => ({ href: moduleHref(m), label: tModules(m), icon: MODULE_ICONS[m] ?? FolderOpen })),
        { href: `${root}/info`, label: tw('aboutProject'), icon: Info },
        ...(canManage ? [{ href: manageBase, label: tw('manage'), icon: Settings2 }] : []),
        // Mobile counterpart of the sidebar cover's arrow chip — the sheet is
        // the only place to step back out on < lg.
        { href: `/${locale}/dashboard`, label: tw('backToDashboard'), icon: ArrowLeft },
      ]

  // Navigation (from the bar or the sheet) closes the sheet.
  useEffect(() => setOpen(false), [pathname])

  // Lift the fixed a11y FAB above the tab bar (globals.css keys on this class).
  useEffect(() => {
    document.documentElement.classList.add('has-project-tabbar')
    return () => document.documentElement.classList.remove('has-project-tabbar')
  }, [])

  useEffect(() => {
    if (open) sheetRef.current?.focus()
    else if (document.activeElement && sheetRef.current?.contains(document.activeElement)) triggerRef.current?.focus()
  }, [open])

  const onSheetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (e.key !== 'Tab' || !sheetRef.current) return
    const focusables = sheetRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    // On open, focus rests on the dialog container itself — treat that as the
    // start of the cycle so the very first Shift+Tab can't escape backwards.
    const atStart = document.activeElement === first || document.activeElement === sheetRef.current
    if (e.shiftKey && atStart) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  const tabClass = 'flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 text-[0.65rem] font-medium'
  const tabStyle = (active: boolean): React.CSSProperties => ({
    color: active ? 'var(--project-accent)' : 'var(--project-ink)',
  })

  const tab = (href: string, label: string, Icon: LucideIcon, exact = false) => {
    const active = isActive(href, exact)
    return (
      <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={tabClass} style={tabStyle(active)}>
        <span
          aria-hidden="true"
          className="w-9 h-1 rounded-full -mt-2 mb-0.5"
          style={{ background: active ? 'var(--project-accent)' : 'transparent' }}
        />
        <Icon aria-hidden="true" className="w-5 h-5" />
        <span className="truncate max-w-full">{label}</span>
      </Link>
    )
  }

  return (
    <>
      {/* Mehr sheet — mounted for the transition, inert while closed */}
      <div
        inert={!open}
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
        <div
          ref={sheetRef}
          id={SHEET_ID}
          role="dialog"
          aria-modal="true"
          aria-label={tw('sidebarMore')}
          tabIndex={-1}
          onKeyDown={onSheetKeyDown}
          className={`absolute inset-x-0 bottom-0 rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-200 ${open ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ background: 'var(--project-white)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-small font-semibold" style={{ color: 'var(--project-accent)' }}>{tw('sidebarMore')}</p>
            <button
              type="button"
              onClick={() => { setOpen(false); triggerRef.current?.focus() }}
              aria-label={tw('sheetClose')}
              className="p-2 rounded-lg"
              style={{ color: 'var(--project-accent)' }}
            >
              <X aria-hidden="true" className="w-5 h-5" />
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-1">
            {sheetItems.map(({ href, label, icon: Icon, badge, badgeSr }) => {
              const active = isActive(href, href === root)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-small"
                    style={active
                      ? { background: 'var(--project-accent)', color: 'var(--project-white)' }
                      : { color: 'var(--project-accent)' }}
                  >
                    <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1">{label}</span>
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
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Manage mode inverts the bar like the desktop sidebar: the nav paints
          the original accent as background and captures it into --mi-* BEFORE
          the swap; the inner wrapper then trades accent ↔ white for the tabs
          and promotes muted ink to white (not gated on the dark accent).
          Capture and swap MUST sit on different elements — on one element the
          var references would cycle. Existing tokens only. */}
      <nav
        aria-label={tw('tabBarLabel')}
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex border-t pb-[env(safe-area-inset-bottom)]"
        style={{
          background: manageMode ? 'var(--project-accent)' : 'var(--project-white)',
          borderColor: 'color-mix(in srgb, var(--project-general) 25%, transparent)',
          ...(manageMode
            ? ({
                '--mi-accent': 'var(--project-accent)',
                '--mi-white': 'var(--project-white)',
              } as React.CSSProperties)
            : undefined),
        }}
      >
        <div
          className="flex flex-1 items-stretch min-w-0"
          style={
            manageMode
              ? ({
                  '--project-accent': 'var(--mi-white)',
                  '--project-white': 'var(--mi-accent)',
                  '--project-ink': 'var(--mi-white)',
                } as React.CSSProperties)
              : undefined
          }
        >
          {tab(overviewHref, manageMode ? tm('sidebar.overview') : tw('overview'), LayoutGrid, true)}
          {directModules.map((m) => tab(moduleHref(m), tModules(m), MODULE_ICONS[m] ?? FolderOpen))}
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={SHEET_ID}
            aria-haspopup="dialog"
            onClick={() => setOpen((o) => !o)}
            className={tabClass}
            style={tabStyle(open)}
          >
            <span aria-hidden="true" className="w-9 h-1 rounded-full -mt-2 mb-0.5" style={{ background: 'transparent' }} />
            <MoreHorizontal aria-hidden="true" className="w-5 h-5" />
            <span className="truncate max-w-full">{tw('sidebarMore')}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
