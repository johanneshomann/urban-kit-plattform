// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

/**
 * "Alle Projekte" on the dashboard: the public-archive filtering (search +
 * status/thema/stadtbereich/year, availability greying, active pills) restyled
 * to match the ActivityFeed's control language — app-var dropdowns instead of
 * the Bereich chip panel. All filtering happens client-side over the list the
 * server page already fetched.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, RotateCcw, Search, X } from 'lucide-react'
import { ProjectJoinButton } from '@/components/platform/ProjectJoinButton'

export type DiscoverProject = {
  id: string
  title: string
  slug: string
  shortDescription?: string | null
  status?: string | null
  thema?: string[] | null
  stadtbereich?: string[] | null
  startYear?: number | null
  createdAt?: string | null
  coverImageUrl?: string | null
  /** Server truth: the viewer has an open join request for this project. */
  requestPending?: boolean
  /** Mirrors the project's joinRequestsEnabled flag (null/undefined → enabled). */
  joinRequestsEnabled?: boolean | null
}

const STATUS_VALUES = ['active', 'planning', 'completed', 'archived']
const THEMA_VALUES = ['mobilitaet', 'wohnraum', 'gruenflaechen', 'infrastruktur', 'stadtentwicklung', 'kultur', 'bildung', 'umwelt']
const STADTBEREICH_VALUES = ['innenstadt', 'norden', 'sueden', 'osten', 'westen', 'gesamtstadt']

const PROJECTS_PER_PAGE = 30

type FilterKey = 'status' | 'thema' | 'stadtbereich' | 'year'
type FilterState = { status: string | null; thema: string | null; stadtbereich: string | null; year: number | null }
const EMPTY_FILTERS: FilterState = { status: null, thema: null, stadtbereich: null, year: null }

function projectYear(p: DiscoverProject): number {
  return p.startYear ?? (p.createdAt ? new Date(p.createdAt).getFullYear() : new Date().getFullYear())
}

/** All values a project holds for a given filter group (always an array). */
function valuesFor(p: DiscoverProject, key: FilterKey): (string | number)[] {
  switch (key) {
    case 'status': return p.status ? [p.status] : []
    case 'thema': return p.thema ?? []
    case 'stadtbereich': return p.stadtbereich ?? []
    case 'year': return [projectYear(p)]
  }
}

export function AllProjectsSection({ projects, locale }: { projects: DiscoverProject[]; locale: string }) {
  const t = useTranslations('dashboard')
  const ta = useTranslations('alleProjekte')
  const tax = useTranslations('taxonomy')
  const tc = useTranslations('common')

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS })
  const [openKey, setOpenKey] = useState<FilterKey | null>(null)

  const availableYears = useMemo(
    () => [...new Set(projects.map(projectYear))].sort((a, b) => b - a),
    [projects],
  )

  const GROUPS = useMemo(() => ([
    { key: 'status' as const, label: ta('filterStatus'), options: STATUS_VALUES.map((v) => ({ value: v as string | number, label: tax(`status.${v}`) })) },
    { key: 'thema' as const, label: ta('filterThema'), options: THEMA_VALUES.map((v) => ({ value: v as string | number, label: tax(`thema.${v}`) })) },
    { key: 'stadtbereich' as const, label: ta('filterStadtbereich'), options: STADTBEREICH_VALUES.map((v) => ({ value: v as string | number, label: tax(`stadtbereich.${v}`) })) },
    { key: 'year' as const, label: ta('filterYear'), options: availableYears.map((y) => ({ value: y as string | number, label: String(y) })) },
  ]), [ta, tax, availableYears])

  const matchesSearch = (p: DiscoverProject) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return p.title.toLowerCase().includes(q) || (p.shortDescription ?? '').toLowerCase().includes(q)
  }
  const matchesFilter = (p: DiscoverProject, key: FilterKey, value: string | number | null) =>
    value === null || valuesFor(p, key).includes(value)

  const filtered = useMemo(
    () => projects.filter((p) =>
      matchesSearch(p) && (Object.keys(filters) as FilterKey[]).every((k) => matchesFilter(p, k, filters[k])),
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, search, filters],
  )

  // A value is "available" if selecting it (given every *other* active filter +
  // the search) still yields at least one project — unavailable options are dimmed.
  const availableValues = useMemo(() => {
    const result = {} as Record<FilterKey, Set<string | number>>
    for (const { key } of GROUPS) {
      const subset = projects.filter((p) =>
        matchesSearch(p) && (Object.keys(filters) as FilterKey[]).every((k) => k === key || matchesFilter(p, k, filters[k])),
      )
      result[key] = new Set(subset.flatMap((p) => valuesFor(p, key)))
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, filters, search, GROUPS])

  const activeGroups = GROUPS.filter(({ key }) => filters[key] !== null)
  const hasAnyActive = activeGroups.length > 0

  function setValue(key: FilterKey, value: string | number) {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }))
    setOpenKey(null)
  }
  function resetAll() {
    setFilters({ ...EMPTY_FILTERS })
  }

  /** Replays the card-in stagger whenever the result set changes. */
  const gridKey = `${search.trim().toLowerCase()}|${filters.status}|${filters.thema}|${filters.stadtbereich}|${filters.year}`

  // Pagination — max 30 cards per page; filter/search changes jump back to page 1.
  const rootRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  useEffect(() => { setPage(0) }, [gridKey])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PROJECTS_PER_PAGE))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = filtered.slice(safePage * PROJECTS_PER_PAGE, (safePage + 1) * PROJECTS_PER_PAGE)

  /** Change page and smooth-scroll back to the section top. */
  const goToPage = (p: number) => {
    setPage(p)
    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion')
    rootRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-2 scroll-mt-14">
      {/* Controls — search first, filters beside it on desktop */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
      {/* Search */}
      <div
        className="md:flex-1 flex items-center gap-2 px-4 h-10 rounded-lg text-small bg-[var(--app-light)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-light))] hover:shadow-sm focus-within:shadow-md focus-within:ring-2"
        style={{ '--tw-ring-color': 'var(--app-accent)' } as React.CSSProperties}
      >
        <Search aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" style={{ color: 'var(--app-ink)' }} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('projectSearchPlaceholder')}
          aria-label={t('projectSearchPlaceholder')}
          className="flex-1 outline-none bg-transparent placeholder:opacity-60"
          style={{ color: 'var(--app-ink)' }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="opacity-40 hover:opacity-80 transition-all duration-200 hover:rotate-90 cursor-pointer"
            aria-label={tc('clearSearch')}
          >
            <X className="w-[1em] h-[1em]" style={{ color: 'var(--app-ink)' }} />
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        {GROUPS.map(({ key, label, options }) => {
          if (options.length === 0) return null
          const open = openKey === key
          const active = filters[key]
          const activeLabel = active !== null ? options.find((o) => o.value === active)?.label ?? String(active) : null
          return (
            <div key={key} className="relative w-40">
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : key)}
                className={`w-full flex items-center justify-between gap-1 px-2.5 h-10 rounded-md text-small transition-all duration-200 hover:shadow-sm cursor-pointer ${active !== null ? 'bg-[var(--app-accent)]' : 'bg-[var(--app-light)] hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-light))]'}`}
                style={{ color: active !== null ? 'var(--app-white)' : 'var(--app-ink)' }}
                aria-haspopup="listbox"
                aria-expanded={open}
              >
                <span className="truncate">{activeLabel ?? label}</span>
                <ChevronDown aria-hidden="true" className={`w-3 h-3 shrink-0 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
              </button>
              <div
                className={`absolute top-full left-0 mt-1 w-full max-h-64 overflow-y-auto rounded-lg shadow-lg z-10 ${open ? 'dropdown-enter' : 'hidden'}`}
                style={{ background: 'var(--app-light)', transformOrigin: 'top left' }}
                role="listbox"
                aria-label={label}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={active === null}
                  onClick={() => { setFilters((f) => ({ ...f, [key]: null })); setOpenKey(null) }}
                  className="w-full text-left px-3 py-1.5 text-small hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,transparent)] transition-colors cursor-pointer"
                  style={{ color: 'var(--app-ink)' }}
                >
                  {ta('filterAll')}
                </button>
                {options.map((opt) => {
                  const unavailable = active !== opt.value && !availableValues[key].has(opt.value)
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="option"
                      aria-selected={active === opt.value}
                      disabled={unavailable}
                      onClick={() => setValue(key, opt.value)}
                      className="w-full text-left px-3 py-1.5 text-small transition-colors enabled:hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,transparent)] enabled:cursor-pointer disabled:opacity-30"
                      style={{
                        color: 'var(--app-ink)',
                        fontWeight: active === opt.value ? 600 : undefined,
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      </div>

      {/* Result count + active filter pills */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <p className="text-small font-medium" style={{ color: 'var(--app-ink)', opacity: 0.6 }}>
          {hasAnyActive || search.trim() ? ta('resultsFound', { count: filtered.length }) : ta('results', { count: filtered.length })}
        </p>
        {activeGroups.map(({ key, label, options }) => {
          const v = filters[key]
          const opt = options.find((o) => o.value === v)
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, [key]: null }))}
              className="group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-small transition-all duration-200 hover:shadow-sm cursor-pointer"
              style={{ color: 'var(--app-ink)', background: 'var(--app-light)' }}
            >
              <span className="opacity-60">{label}:</span>
              <span className="font-semibold">{opt?.label ?? String(v)}</span>
              <X aria-hidden className="w-[1em] h-[1em] transition-transform duration-300 group-hover:rotate-90" />
            </button>
          )
        })}
        {activeGroups.length > 1 && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1 text-small underline opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--app-ink)' }}
          >
            <RotateCcw aria-hidden className="w-[1em] h-[1em]" />
            {ta('resetFilters')}
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-small" style={{ color: 'var(--app-ink)', opacity: 0.5 }}>{ta('emptyResults')}</p>
          {(hasAnyActive || search.trim()) && (
            <button
              type="button"
              onClick={() => { resetAll(); setSearch('') }}
              className="mt-3 text-small underline cursor-pointer"
              style={{ color: 'var(--app-accent)' }}
            >
              {ta('resetFilters')}
            </button>
          )}
        </div>
      ) : (
        <div key={`${gridKey}|${safePage}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
          {pageItems.map((p, i) => (
            <div
              key={p.id}
              className="card-in flex flex-col rounded-xl overflow-hidden shadow-sm"
              style={{
                animationDelay: `${Math.min(i * 40, 320)}ms`,
                background: 'var(--app-light)',
              }}
            >
              {/* Cover thumbnail */}
              <div className="relative w-full h-40 overflow-hidden" style={{ background: 'var(--app-light)' }}>
                {p.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverImageUrl}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col p-4 gap-2">
                <h3 className="text-text font-bold leading-snug" style={{ color: 'var(--app-ink-accent)' }}>
                  {p.title}
                </h3>
                {p.shortDescription && (
                  <p className="text-small line-clamp-2 flex-1" style={{ color: 'var(--app-ink)', opacity: 0.65 }}>
                    {p.shortDescription}
                  </p>
                )}

                {/* Always-visible actions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link
                    href={`/${locale}/projekte/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 h-11 rounded-lg text-small font-medium bg-[var(--app-ink)] transition-colors hover:bg-[var(--app-black)] text-[var(--app-white)]"
                  >
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                    {t('openProject')}
                  </Link>
                  <ProjectJoinButton
                    slug={p.slug}
                    locale={locale}
                    requestPending={p.requestPending === true}
                    joinEnabled={p.joinRequestsEnabled !== false}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination — same pattern as the Meine-Projekte pills */}
      {pageCount > 1 && (
        <nav aria-label={t('sectionOtherProjects')} className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => goToPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            aria-label={t('paginationPrev')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--app-light)] transition-all duration-200 enabled:hover:scale-110 enabled:hover:shadow-md enabled:cursor-pointer disabled:opacity-30"
            style={{ color: 'var(--app-ink-accent)' }}
          >
            <ChevronLeft className="w-5 h-5" aria-hidden />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                aria-label={t('paginationPage', { page: i + 1, total: pageCount })}
                aria-current={i === safePage ? 'page' : undefined}
                className="h-2.5 rounded-full cursor-pointer"
                style={{
                  width: i === safePage ? '1.75rem' : '0.625rem',
                  background: i === safePage ? 'var(--app-accent)' : 'color-mix(in srgb, var(--app-ink) 25%, transparent)',
                  transition: 'width 0.3s cubic-bezier(0.22,1,0.36,1), background 0.2s',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goToPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage === pageCount - 1}
            aria-label={t('paginationNext')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--app-light)] transition-all duration-200 enabled:hover:scale-110 enabled:hover:shadow-md enabled:cursor-pointer disabled:opacity-30"
            style={{ color: 'var(--app-ink-accent)' }}
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
        </nav>
      )}
    </div>
  )
}
