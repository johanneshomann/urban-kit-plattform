'use client'

/**
 * Public project archive: a searchable, filterable catalogue. The search box +
 * filter toolbar design is ported from the sibling `urban-kit-methodensammlung`
 * project (collapsible filter panel, chip groups, active-filter pills, column
 * settings) but rethemed to the plattform's `--projekte-*` / `--plattform-*`
 * tokens. All filtering happens in the browser over the full project list.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Search, X, FolderOpen, SlidersHorizontal, ChevronDown, RotateCcw,
  Settings, LayoutGrid, Columns2, Rows3, CircleDot, Tag, MapPin, Calendar,
  type LucideIcon,
} from 'lucide-react'
import { EyebrowBadge } from '@/components/public/EyebrowBadge'
import { ScrollHint } from '@/components/public/ScrollHint'
import type { Project } from './ProjectLibrary'

const STATUS_VALUES = ['active', 'planning', 'completed', 'archived']
const THEMA_VALUES = ['mobilitaet', 'wohnraum', 'gruenflaechen', 'infrastruktur', 'stadtentwicklung', 'kultur', 'bildung', 'umwelt']
const STADTBEREICH_VALUES = ['innenstadt', 'norden', 'sueden', 'osten', 'westen', 'gesamtstadt']

const accentP = (chunks: ReactNode) => <span style={{ color: 'var(--projekte-dark)' }}>{chunks}</span>

type FilterKey = 'status' | 'thema' | 'stadtbereich' | 'year'
type FilterState = { status: string | null; thema: string | null; stadtbereich: string | null; year: number | null }
const EMPTY_FILTERS: FilterState = { status: null, thema: null, stadtbereich: null, year: null }

function projectYear(p: Project): number {
  return p.startYear ?? new Date(p.createdAt).getFullYear()
}

function coverUrl(p: Project): string | null {
  const c = p.coverImage
  if (!c || typeof c === 'string') return null
  return c.url ?? null
}

/** All values a project holds for a given filter group (always an array). */
function valuesFor(p: Project, key: FilterKey): (string | number)[] {
  switch (key) {
    case 'status': return p.status ? [p.status] : []
    case 'thema': return p.thema ?? []
    case 'stadtbereich': return p.stadtbereich ?? []
    case 'year': return [projectYear(p)]
  }
}

/**
 * Small reset affordance: a dot that morphs into an × on hover, with a portalled
 * tooltip that escapes the panel's overflow. Ported from methodensammlung.
 */
function ClearDot({ onClear, tooltip }: { onClear: (e: React.MouseEvent) => void; tooltip: string }) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function enter() {
    setHovered(true)
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    timer.current = setTimeout(() => setPos({ x: rect.left + rect.width / 2, y: rect.top }), 550)
  }
  function leave() {
    setHovered(false)
    if (timer.current) clearTimeout(timer.current)
    setPos(null)
  }

  return (
    <>
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={onClear}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClear(e as unknown as React.MouseEvent) }}
        onMouseEnter={enter}
        onMouseLeave={leave}
        className="shrink-0 relative flex items-center justify-center cursor-pointer"
        style={{ width: '1em', height: '1em', color: 'var(--projekte-dark)' }}
        aria-label={tooltip}
      >
        <span
          aria-hidden
          className="rounded-full block absolute"
          style={{
            background: 'var(--projekte-dark)', width: '0.4em', height: '0.4em',
            opacity: hovered ? 0 : 1,
            transform: hovered ? 'scale(0) rotate(90deg)' : 'scale(1) rotate(0deg)',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
        />
        <X
          aria-hidden
          className="absolute"
          style={{
            width: '0.85em', height: '0.85em',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-90deg)',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
        />
      </span>
      {pos && createPortal(
        <span
          className="tooltip-in pointer-events-none text-small whitespace-nowrap px-2.5 py-1 rounded-lg bg-white shadow-md"
          style={{
            position: 'fixed', left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)',
            color: 'var(--plattform-ink)', zIndex: 9999,
          }}
        >
          {tooltip}
        </span>,
        document.body,
      )}
    </>
  )
}

/** A selectable filter value inside the panel. Greyed out when it leads nowhere. */
function Chip({ label, icon, isActive, isAvailable, onClick }: {
  label: string; icon?: ReactNode; isActive: boolean; isAvailable: boolean; onClick: () => void
}) {
  const unavailable = !isActive && !isAvailable
  return (
    <button
      type="button"
      onClick={unavailable ? undefined : onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-text transition-all ${
        isActive
          ? 'bg-[var(--projekte-dark)] text-white cursor-pointer'
          : unavailable
            ? 'bg-[var(--projekte-light)] text-[var(--plattform-ink)] opacity-30 cursor-default'
            : 'bg-[var(--projekte-light)] text-[var(--plattform-ink)] hover:bg-[var(--projekte-dark)] hover:text-white cursor-pointer'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

/** A removable summary tag for one currently-active filter. */
function FilterPill({ icon, label, value, onClick }: { icon?: ReactNode; label: string; value: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-small transition-all cursor-pointer"
      style={{ color: 'var(--plattform-ink)' }}
    >
      {icon}
      <span>{label}:</span>
      <span className="font-semibold">{value}</span>
      <X
        className="shrink-0 w-[1em] h-[1em]"
        style={{
          color: 'var(--projekte-dark)',
          transform: hovered ? 'scale(1.2) rotate(90deg)' : 'scale(1) rotate(0deg)',
          transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
      />
    </button>
  )
}

function SearchPill({ value, onChange, onFocus, placeholder }: {
  value: string; onChange: (v: string) => void; onFocus?: () => void; placeholder: string
}) {
  return (
    <div
      className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-text shadow-sm hover:shadow-md transition-shadow"
      style={{ background: 'white' }}
    >
      <Search className="w-[1em] h-[1em] shrink-0 opacity-40" style={{ color: 'var(--plattform-ink)' }} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="flex-1 outline-none bg-transparent placeholder:opacity-40"
        style={{ color: 'var(--plattform-ink)' }}
      />
      {value && (
        <button onClick={() => onChange('')} className="opacity-40 hover:opacity-80 transition-opacity cursor-pointer" aria-label="Suche zurücksetzen">
          <X className="w-[1em] h-[1em]" style={{ color: 'var(--plattform-ink)' }} />
        </button>
      )}
    </div>
  )
}

export function AlleProjekteClient({ projects, locale }: { projects: Project[]; locale: string; cityName: string }) {
  const t = useTranslations('alleProjekte')
  const tax = useTranslations('taxonomy')

  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS })
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [openKeys, setOpenKeys] = useState<Set<FilterKey>>(new Set())
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(3)
  const [showAuszug, setShowAuszug] = useState(true)
  const [showImage, setShowImage] = useState(true)

  const libraryRef = useRef<HTMLDivElement>(null)
  const filterAreaRef = useRef<HTMLDivElement>(null)
  const settingsAreaRef = useRef<HTMLDivElement>(null)

  const availableYears = useMemo(() => {
    const fromProjects = projects.map(projectYear)
    const currentYear = new Date().getFullYear()
    const defaults = [currentYear, currentYear - 1, currentYear - 2]
    return [...new Set([...fromProjects, ...defaults])].sort((a, b) => b - a)
  }, [projects])

  // Group definitions drive both the panel and the active-pill row.
  const GROUPS = useMemo(() => ([
    { key: 'status' as const, label: t('filterStatus'), icon: CircleDot, options: STATUS_VALUES.map((v) => ({ value: v, label: tax(`status.${v}`) })) },
    { key: 'thema' as const, label: t('filterThema'), icon: Tag, options: THEMA_VALUES.map((v) => ({ value: v, label: tax(`thema.${v}`) })) },
    { key: 'stadtbereich' as const, label: t('filterStadtbereich'), icon: MapPin, options: STADTBEREICH_VALUES.map((v) => ({ value: v, label: tax(`stadtbereich.${v}`) })) },
    { key: 'year' as const, label: t('filterYear'), icon: Calendar, options: availableYears.map((y) => ({ value: y, label: String(y) })) },
  ]), [t, tax, availableYears])

  const matchesSearch = (p: Project) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return p.title.toLowerCase().includes(q) || (p.shortDescription ?? '').toLowerCase().includes(q)
  }
  const matchesFilter = (p: Project, key: FilterKey, value: string | number | null) =>
    value === null || valuesFor(p, key).includes(value)

  const filtered = useMemo(
    () => projects.filter((p) =>
      matchesSearch(p) && (Object.keys(filters) as FilterKey[]).every((k) => matchesFilter(p, k, filters[k])),
    ),
    [projects, search, filters],
  )

  // A value is "available" if selecting it (given every *other* active filter +
  // the search) would still yield at least one project — used to grey out chips.
  const availableValues = useMemo(() => {
    const result = {} as Record<FilterKey, Set<string | number>>
    for (const { key } of GROUPS) {
      const subset = projects.filter((p) =>
        matchesSearch(p) && (Object.keys(filters) as FilterKey[]).every((k) => k === key || matchesFilter(p, k, filters[k])),
      )
      result[key] = new Set(subset.flatMap((p) => valuesFor(p, key)))
    }
    return result
  }, [projects, filters, search, GROUPS])

  const activeCount = (Object.keys(filters) as FilterKey[]).filter((k) => filters[k] !== null).length
  const hasAnyActive = activeCount > 0

  function setValue(key: FilterKey, value: string | number) {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }))
  }
  function toggleAccordion(key: FilterKey) {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  function resetAll() {
    setFilters({ ...EMPTY_FILTERS })
  }

  // Collapse the inner accordions whenever the whole panel closes.
  useEffect(() => { if (!filterOpen) setOpenKeys(new Set()) }, [filterOpen])

  // Outside-click close for the panel + settings popover.
  useEffect(() => {
    if (!filterOpen) return
    function onClick(e: MouseEvent) {
      if (filterAreaRef.current && !filterAreaRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [filterOpen])
  useEffect(() => {
    if (!settingsOpen) return
    function onClick(e: MouseEvent) {
      if (settingsAreaRef.current && !settingsAreaRef.current.contains(e.target as Node)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [settingsOpen])

  const gridClass = gridCols === 1 ? 'grid-cols-1' : gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'

  return (
    <>
      {/* Hero */}
      <section className="relative flex-1 min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden" style={{ background: 'var(--projekte-light)' }}>
        <ScrollHint color="var(--projekte-dark)" />
        <FolderOpen
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 h-[45%] w-auto opacity-10 pointer-events-none"
          strokeWidth={1}
          aria-hidden="true"
          style={{ color: 'var(--projekte-dark)' }}
        />
        <div className="relative z-10 flex-1 flex flex-col justify-start px-6 pt-20 md:pt-28 md:px-16 lg:px-24">
          <EyebrowBadge label={t('heroEyebrow')} bg="var(--projekte)" color="var(--plattform-ink)" />
          <h1 className="text-hero font-black leading-none tracking-tight mb-5">
            {t.rich('heroTitle', { accentP })}
          </h1>
          <p className="text-text leading-relaxed max-w-2xl mb-4" style={{ color: 'var(--plattform-ink)' }}>{t('heroP1')}</p>
          <p className="text-text leading-relaxed max-w-2xl" style={{ color: 'var(--plattform-ink)' }}>{t('heroP2')}</p>
        </div>
      </section>

      {/* Library */}
      <div ref={libraryRef} style={{ background: 'var(--projekte-light)' }}>
        {/* Sticky toolbar + collapsible filter panel */}
        <div className="sticky top-14 z-20" style={{ background: 'var(--projekte-light)' }}>
          <div className="px-6 md:px-16 lg:px-24 py-4 flex flex-col gap-2" ref={filterAreaRef}>
            <div className="flex flex-col sm:flex-row gap-2">
              <SearchPill value={search} onChange={setSearch} placeholder={t('searchPlaceholder')} />

              <div className="flex gap-2 sm:contents">
                {/* Filter toggle */}
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-display cursor-pointer flex-1 sm:flex-none ${filterOpen ? 'sm:min-w-[16rem] bg-[var(--projekte)]' : 'sm:min-w-[12rem] bg-white hover:bg-[var(--projekte)]'}`}
                  style={{
                    color: 'var(--plattform-ink)',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    transition: 'background 0.2s, box-shadow 0.2s, min-width 0.4s cubic-bezier(0.22,1,0.36,1)',
                  }}
                >
                  <SlidersHorizontal className="w-[1em] h-[1em] shrink-0" />
                  <span>{t('filterLabel')}</span>
                  <span
                    style={{
                      display: 'inline-flex', overflow: 'hidden', marginLeft: '-0.25em',
                      maxWidth: hasAnyActive ? '1.5em' : '0',
                      transition: 'max-width 0.4s cubic-bezier(0.22,1,0.36,1)',
                    }}
                  >
                    <ClearDot tooltip={t('resetAll')} onClear={(e) => { e.stopPropagation(); resetAll() }} />
                  </span>
                  <ChevronDown className={`w-[1em] h-[1em] shrink-0 ml-auto transition-transform duration-300 ${filterOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Settings (column count) */}
                <div className="relative shrink-0 self-stretch" ref={settingsAreaRef}>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((v) => !v)}
                    className={`h-full min-h-[2.75rem] flex items-center justify-center px-4 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md text-display ${settingsOpen ? 'bg-[var(--projekte)]' : 'bg-white hover:bg-[var(--projekte)]'}`}
                    style={{ color: 'var(--plattform-ink)' }}
                    aria-label={t('viewSettings')}
                  >
                    <Settings className="w-[1em] h-[1em] shrink-0" />
                  </button>

                  {settingsOpen && (
                    <div
                      className="popover-in absolute right-0 top-full mt-2 rounded-xl p-3 flex flex-col gap-3 z-50 max-w-[calc(100vw-2rem)]"
                      style={{ background: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '11rem' }}
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="text-small opacity-50" style={{ color: 'var(--plattform-ink)' }}>{t('columns')}</span>
                        <div className="flex gap-1">
                          {([3, 2, 1] as const).map((n) => {
                            const Icon: LucideIcon = n === 1 ? Rows3 : n === 2 ? Columns2 : LayoutGrid
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setGridCols(n)}
                                className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all cursor-pointer text-text ${gridCols === n ? 'bg-[var(--projekte-dark)] text-white' : 'bg-[var(--projekte-light)] text-[var(--plattform-ink)] hover:bg-[var(--projekte-dark)] hover:text-white'}`}
                                aria-label={`${n}`}
                              >
                                <Icon className="w-[1em] h-[1em]" />
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Image toggle */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-small opacity-50" style={{ color: 'var(--plattform-ink)' }}>{t('imageLabel')}</span>
                        <div className="flex gap-1">
                          {([true, false] as const).map((on) => (
                            <button
                              key={String(on)}
                              type="button"
                              onClick={() => setShowImage(on)}
                              className={`flex-1 px-2 py-1.5 rounded-lg text-small transition-all cursor-pointer ${showImage === on ? 'bg-[var(--projekte-dark)] text-white' : 'bg-[var(--projekte-light)] text-[var(--plattform-ink)] hover:bg-[var(--projekte-dark)] hover:text-white'}`}
                            >
                              {on ? t('excerptShow') : t('excerptHide')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Auszug (excerpt) toggle */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-small opacity-50" style={{ color: 'var(--plattform-ink)' }}>{t('excerptLabel')}</span>
                        <div className="flex gap-1">
                          {([true, false] as const).map((on) => (
                            <button
                              key={String(on)}
                              type="button"
                              onClick={() => setShowAuszug(on)}
                              className={`flex-1 px-2 py-1.5 rounded-lg text-small transition-all cursor-pointer ${showAuszug === on ? 'bg-[var(--projekte-dark)] text-white' : 'bg-[var(--projekte-light)] text-[var(--plattform-ink)] hover:bg-[var(--projekte-dark)] hover:text-white'}`}
                            >
                              {on ? t('excerptShow') : t('excerptHide')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible filter panel */}
            <div
              className="rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              style={{ display: 'grid', gridTemplateRows: filterOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s' }}
            >
              <div style={{ overflow: 'hidden', background: 'white' }}>
                <div className="flex flex-col">
                  {GROUPS.map(({ key, label, icon: Icon, options }) => {
                    if (options.length === 0) return null
                    const isOpen = openKeys.has(key)
                    const hasActive = filters[key] !== null
                    return (
                      <div
                        key={key}
                        className="transition-colors"
                        style={{ background: isOpen ? 'var(--projekte)' : 'transparent' }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccordion(key)}
                          className={`w-full flex items-center justify-between px-5 py-3 text-left cursor-pointer transition-colors ${isOpen ? '' : 'hover:bg-[var(--projekte)]'}`}
                          style={{ color: 'var(--plattform-ink)' }}
                        >
                          <span className="flex items-center gap-2 text-text">
                            <Icon className="w-[1em] h-[1em]" />
                            <span className="font-medium">{label}</span>
                            {hasActive && (
                              <ClearDot tooltip={t('resetGroup', { group: label })} onClear={(e) => { e.stopPropagation(); setFilters((f) => ({ ...f, [key]: null })) }} />
                            )}
                          </span>
                          <ChevronDown className={`w-[1em] h-[1em] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ opacity: 0.5 }} />
                        </button>
                        <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
                          <div style={{ overflow: 'hidden' }}>
                            <div className="px-5 pb-4 pt-2 flex flex-wrap gap-1.5">
                              {options.map((opt) => (
                                <Chip
                                  key={String(opt.value)}
                                  label={opt.label}
                                  isActive={filters[key] === opt.value}
                                  isAvailable={availableValues[key].has(opt.value)}
                                  onClick={() => setValue(key, opt.value)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Result count + active filter pills */}
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-small font-medium" style={{ color: 'var(--plattform-ink)', opacity: 0.6 }}>
                {hasAnyActive || search ? t('resultsFound', { count: filtered.length }) : t('results', { count: filtered.length })}
              </p>
              {hasAnyActive && (
                <div className="flex flex-wrap gap-1">
                  {activeCount > 1 && (
                    <FilterPill icon={<RotateCcw className="w-[1em] h-[1em]" aria-hidden />} label={t('filterAll')} value={t('resetValue')} onClick={resetAll} />
                  )}
                  {GROUPS.flatMap(({ key, label, icon: Icon, options }) => {
                    const v = filters[key]
                    if (v === null) return []
                    const opt = options.find((o) => o.value === v)
                    return [(
                      <FilterPill
                        key={key}
                        icon={<Icon className="w-[1em] h-[1em]" aria-hidden />}
                        label={label}
                        value={opt?.label ?? String(v)}
                        onClick={() => setFilters((f) => ({ ...f, [key]: null }))}
                      />
                    )]
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="px-6 md:px-16 lg:px-24 py-12">
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-text" style={{ color: 'var(--plattform-ink)', opacity: 0.5 }}>{t('emptyResults')}</p>
              <button onClick={resetAll} className="mt-4 text-small underline" style={{ color: 'var(--projekte-dark)' }}>
                {t('resetFilters')}
              </button>
            </div>
          ) : (
            <div
              key={`${search}|${filters.status}|${filters.thema}|${filters.stadtbereich}|${filters.year}`}
              className={`grid gap-6 ${gridClass}`}
            >
              {filtered.map((p, i) => {
                const projYear = projectYear(p)
                const cover = coverUrl(p)
                return (
                  <div key={p.id} className="card-in" style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}>
                    <Link
                      href={`/${locale}/projekte/${p.slug}`}
                      className="group relative flex flex-col h-full rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Cover image strip */}
                      {showImage && (
                        <div className="relative h-44 sm:h-56 w-full overflow-hidden shrink-0" style={{ background: 'var(--projekte-light)' }}>
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} alt="" aria-hidden className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FolderOpen className="w-1/3 h-1/3 opacity-20" strokeWidth={1} aria-hidden style={{ color: 'var(--projekte-dark)' }} />
                            </div>
                          )}
                          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
                            {p.status ? (
                              <span className="text-small font-semibold px-3 py-1 rounded-full bg-white shadow-sm" style={{ color: 'var(--projekte-dark)' }}>
                                {tax(`status.${p.status}`)}
                              </span>
                            ) : <span />}
                            <span className="text-small font-semibold px-2.5 py-1 rounded-full bg-white shadow-sm" style={{ color: 'var(--plattform-ink)' }}>{projYear}</span>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex flex-col gap-4 p-7 flex-1">
                        {!showImage && (
                          <div className="flex items-center justify-between gap-2">
                            {p.status ? (
                              <span className="text-small font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--projekte-light)', color: 'var(--projekte-dark)' }}>
                                {tax(`status.${p.status}`)}
                              </span>
                            ) : <span />}
                            <span className="text-small font-semibold" style={{ color: 'var(--plattform-ink)', opacity: 0.4 }}>{projYear}</span>
                          </div>
                        )}
                        <h3 className="text-display font-black leading-tight tracking-tight" style={{ color: 'var(--projekte-dark)' }}>
                          {p.title}
                        </h3>
                        {showAuszug && p.shortDescription && (
                          <p className="text-small line-clamp-3" style={{ color: 'var(--plattform-ink)', opacity: 0.7 }}>{p.shortDescription}</p>
                        )}
                        {(p.thema ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {(p.thema ?? []).map((th) => (
                              <span key={th} className="text-small px-3 py-0.5 rounded-full" style={{ background: 'var(--projekte-light)', color: 'var(--plattform-ink)' }}>
                                {tax(`thema.${th}`)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
