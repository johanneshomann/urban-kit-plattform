// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FolderOpen, LayoutGrid, Loader2, Search, X } from 'lucide-react'
import { MODULE_ICONS } from '@/components/platform/ProjectSidebar'
import { searchAllProjectsAction, searchWorkspaceAction } from '@/actions/search-workspace'
import type { CrossProjectSearchResult, WorkspaceSearchResult } from '@/lib/workspace-search'

/** Cross-component open signal — header triggers dispatch this. */
const OPEN_EVENT = 'uk:workspace-search-open'

/** Open the palette from anywhere under the dashboard (client only). */
export function openWorkspaceSearch() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

// ── Project scope store ──────────────────────────────────────────────────────
// The palette is mounted ONCE in the dashboard layout (so ⌘K works everywhere,
// incl. the workspace); the project layout registers the current project here.
// A module-level store instead of events/context: child effects run before
// parent effects, so subscribers always read the latest value on mount.

type SearchScope = { slug: string; title: string }

let currentScope: SearchScope | null = null
const scopeListeners = new Set<(s: SearchScope | null) => void>()

function setSearchScope(s: SearchScope | null) {
  currentScope = s
  scopeListeners.forEach((l) => l(s))
}

function useSearchScope(): SearchScope | null {
  const [scope, setScope] = useState<SearchScope | null>(currentScope)
  useEffect(() => {
    setScope(currentScope)
    scopeListeners.add(setScope)
    return () => { scopeListeners.delete(setScope) }
  }, [])
  return scope
}

/** Renders nothing — mounted by the project layout to scope the palette. */
export function WorkspaceSearchScope({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    setSearchScope({ slug, title })
    return () => setSearchScope(null)
  }, [slug, title])
  return null
}

// ── Triggers ─────────────────────────────────────────────────────────────────

/**
 * Search trigger for the breadcrumb content header — sits left of the
 * language switch, matching its quiet ink/accent styling.
 */
export function WorkspaceSearchTrigger() {
  const tw = useTranslations('projectWorkspace')
  return (
    <button
      type="button"
      onClick={openWorkspaceSearch}
      className="flex items-center gap-1.5 text-small font-medium cursor-pointer transition-colors hover:text-[var(--project-accent,var(--app-accent))]"
      style={{ color: 'var(--project-ink, var(--app-ink))' }}
    >
      <Search aria-hidden="true" className="w-4 h-4" />
      <span className="sr-only">{tw('search')}</span>
      <kbd aria-hidden="true" className="hidden md:inline text-[0.65rem] font-semibold opacity-60">⌘K</kbd>
    </button>
  )
}

// ── Palette ──────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 250
const MIN_CHARS = 2

type Hit = WorkspaceSearchResult & Partial<Pick<CrossProjectSearchResult, 'projectSlug' | 'projectTitle' | 'projectVars'>>

/**
 * ⌘K search palette. Opens via Cmd/Ctrl+K or {@link openWorkspaceSearch}.
 * Inside a project it starts scoped to it (removable chip — remove to search
 * ALL of the viewer's projects); on the dashboard it searches all projects
 * right away. All role/visibility scoping happens server-side per project.
 */
export function WorkspaceSearchPalette({ locale }: { locale: string }) {
  const tw = useTranslations('projectWorkspace')
  const tModules = useTranslations('modules')
  const router = useRouter()
  const scope = useSearchScope()

  const [open, setOpen] = useState(false)
  const [scopeActive, setScopeActive] = useState(true)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Hit[]>([])
  const [pending, setPending] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const seqRef = useRef(0)

  const scoped = scopeActive && scope !== null

  // Global hotkey + programmatic open events
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [])

  // Fresh state + focus on every open; scope chip returns on reopen
  useEffect(() => {
    if (!open) return
    setQ('')
    setResults([])
    setActiveIdx(0)
    setPending(false)
    setScopeActive(true)
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  // Debounced server search; seq guard drops stale responses
  useEffect(() => {
    if (!open) return
    const query = q.trim()
    if (query.length < MIN_CHARS) {
      setResults([])
      setPending(false)
      return
    }
    setPending(true)
    const id = ++seqRef.current
    const t = setTimeout(async () => {
      const res = scoped && scope
        ? await searchWorkspaceAction({ slug: scope.slug, query })
        : await searchAllProjectsAction({ query })
      if (seqRef.current !== id) return
      setPending(false)
      setResults('results' in res ? res.results : [])
      setActiveIdx(0)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [q, open, scoped, scope])

  const go = (r: Hit) => {
    const slug = scoped && scope ? scope.slug : r.projectSlug
    if (!slug) return
    setOpen(false)
    router.push(`/${locale}/dashboard/projekte/${slug}${r.href}`)
  }

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault()
      go(results[activeIdx])
    } else if (e.key === 'Backspace' && q === '' && scoped) {
      // Empty input + Backspace drops the project chip, like tag inputs
      setScopeActive(false)
    }
  }

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    // Focus trap (same pattern as the tab-bar sheet)
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = panelRef.current.querySelectorAll<HTMLElement>('input, button:not([disabled])')
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const atStart = document.activeElement === first || document.activeElement === panelRef.current
    if (e.shiftKey && atStart) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  // Scoped: group by module. Cross-project: group by project.
  const groups: { key: string; label: string; items: { r: Hit; idx: number }[] }[] = []
  results.forEach((r, idx) => {
    const key = scoped ? r.module : (r.projectSlug ?? '')
    const label = scoped ? tModules(r.module) : (r.projectTitle ?? '')
    const g = groups.find((g) => g.key === key)
    if (g) g.items.push({ r, idx })
    else groups.push({ key, label, items: [{ r, idx }] })
  })

  const showEmpty = q.trim().length >= MIN_CHARS && !pending && results.length === 0

  return (
    <div
      inert={!open}
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={tw('search')}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className="absolute inset-x-3 top-[12vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[44rem] sm:max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: 'var(--project-white, var(--app-white))',
          borderColor: 'color-mix(in srgb, var(--project-general, var(--app-ink)) 25%, transparent)',
        }}
      >
        <div
          className={`flex items-center gap-3 px-5 ${scoped && scope ? '' : 'border-b'}`}
          style={{ borderColor: 'color-mix(in srgb, var(--project-general, var(--app-ink)) 20%, transparent)' }}
        >
          {pending
            ? <Loader2 aria-hidden="true" className="w-4 h-4 shrink-0 animate-spin" style={{ color: 'var(--project-ink, var(--app-ink))' }} />
            : <Search aria-hidden="true" className="w-4 h-4 shrink-0" style={{ color: 'var(--project-ink, var(--app-ink))' }} />}
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={scoped ? tw('searchPlaceholder') : tw('searchPlaceholderAll')}
            aria-label={tw('search')}
            className="flex-1 min-w-0 bg-transparent py-4 text-text outline-none placeholder:opacity-60"
            style={{ color: 'var(--project-accent, var(--app-ink))' }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={tw('sheetClose')}
            className="p-2 -mr-2 rounded-lg"
            style={{ color: 'var(--project-accent, var(--app-ink))' }}
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* Project scope chip — its own row under the search bar; remove to
            search across all own projects (pill + rotating X, same pattern as
            the activity feed filters) */}
        {scoped && scope && (
          <div
            className="flex items-center px-5 pb-3 border-b"
            style={{ borderColor: 'color-mix(in srgb, var(--project-general, var(--app-ink)) 20%, transparent)' }}
          >
            <button
              type="button"
              onClick={() => { setScopeActive(false); inputRef.current?.focus() }}
              className="group inline-flex items-center gap-1.5 max-w-full px-3 py-1 rounded-full text-small transition-all duration-200 hover:shadow-sm cursor-pointer"
              style={{
                background: 'color-mix(in srgb, var(--project-accent, var(--app-accent)) 12%, transparent)',
                color: 'var(--project-accent, var(--app-accent))',
              }}
            >
              <span className="font-semibold truncate">{scope.title}</span>
              <X aria-hidden="true" className="w-[1em] h-[1em] shrink-0 transition-transform duration-300 group-hover:rotate-90" />
              <span className="sr-only">{tw('searchScopeRemove')}</span>
            </button>
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto py-3" aria-live="polite">
          {q.trim().length < MIN_CHARS && (
            <p className="px-5 py-4 text-small" style={{ color: 'var(--project-ink, var(--app-ink))' }}>{tw('searchHint')}</p>
          )}
          {showEmpty && (
            <p className="px-5 py-4 text-small" style={{ color: 'var(--project-ink, var(--app-ink))' }}>{tw('searchEmpty')}</p>
          )}
          {groups.map(({ key, label, items }) => (
            // In cross-project mode each group carries its project's resolved
            // --project-* vars, so headers and rows chameleon per project.
            <div key={key} style={scoped ? undefined : (items[0]?.r.projectVars as React.CSSProperties)}>
              <p
                className="flex items-center gap-2 px-5 pt-4 pb-1.5 text-[0.7rem] font-bold uppercase tracking-widest"
                style={{ color: 'var(--project-ink, var(--app-ink))' }}
              >
                {!scoped && (
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: 'var(--project-accent, var(--app-accent))' }}
                  />
                )}
                {label}
              </p>
              <ul>
                {items.map(({ r, idx }) => {
                  const Icon = r.module === 'project' ? LayoutGrid : (MODULE_ICONS[r.module] ?? FolderOpen)
                  const active = idx === activeIdx
                  return (
                    <li key={`${r.projectSlug ?? ''}:${r.module}:${r.docId}`}>
                      <button
                        type="button"
                        onClick={() => go(r)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-small"
                        style={active
                          ? { background: 'var(--project-accent, var(--app-accent))', color: 'var(--project-white, var(--app-white))' }
                          : { color: 'var(--project-accent, var(--app-ink))' }}
                      >
                        <Icon aria-hidden="true" className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">{r.title}</span>
                        <span className="truncate max-w-[35%] text-[0.75rem] opacity-70">
                          {scoped ? (r.meta ?? '') : r.module === 'project' ? tw('searchProjectHit') : tModules(r.module)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
