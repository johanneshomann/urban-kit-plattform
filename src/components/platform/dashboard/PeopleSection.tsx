// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { ChevronDown, RotateCcw, Search, UserCircle, X } from 'lucide-react'
import { searchPeople } from '@/actions/search-people'
import type { Person } from '@/lib/people-search'
import { PROFILE_BADGE_ICONS, PROFILE_BADGE_VALUES, type ProfileBadge } from '@/lib/profile-badges'

const AFFILIATIONS = ['citizen', 'student', 'cityEmployee', 'academia', 'other'] as const

/** Collapsed row count (3 grid rows) and the server-side result cap. */
const MAX_VISIBLE = 9

function Avatar({ person, size }: { person: Person; size: 'row' | 'dialog' }) {
  const circle = size === 'row' ? 'w-10 h-10' : 'w-16 h-16'
  const fallback = size === 'row' ? 'w-6 h-6' : 'w-9 h-9'
  const badgeCircle = size === 'row' ? 'h-5 w-5' : 'h-6 w-6'
  const badgeIcon = size === 'row' ? 'h-3 w-3' : 'h-3.5 w-3.5'
  const BadgeIcon =
    person.profileBadge && (PROFILE_BADGE_VALUES as readonly string[]).includes(person.profileBadge)
      ? PROFILE_BADGE_ICONS[person.profileBadge as ProfileBadge]
      : null
  return (
    <div className="relative shrink-0">
      <div
        className={`${circle} rounded-full overflow-hidden flex items-center justify-center`}
        style={{ background: 'color-mix(in srgb, var(--app-accent) 12%, transparent)' }}
      >
        {person.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatarUrl} alt="" aria-hidden className="w-full h-full object-cover" />
        ) : (
          <UserCircle className={fallback} style={{ color: 'var(--app-accent)' }} aria-hidden />
        )}
      </div>
      {BadgeIcon && (
        <span
          aria-hidden
          className={`absolute -bottom-0.5 -right-0.5 inline-flex ${badgeCircle} items-center justify-center rounded-full shadow-sm`}
          style={{ background: 'var(--app-accent)', color: 'var(--app-white)' }}
        >
          <BadgeIcon className={badgeIcon} />
        </span>
      )}
    </div>
  )
}

/**
 * "Personen entdecken" — the dashboard's people search. Shows the viewer's
 * project peers by default; typing at least 2 characters searches the whole
 * platform by name (server-side via searchPeople, which enforces the privacy
 * rules). A row opens a centered profile pop-up with badge, bio, gallery and
 * shared projects.
 */
export function PeopleSection({
  initialPeople,
  projects,
}: {
  initialPeople: Person[]
  projects: { id: string; title: string }[]
}) {
  const t = useTranslations('dashboard')
  const tpr = useTranslations('profile')
  const tc = useTranslations('common')
  const ta = useTranslations('alleProjekte')
  const sectionRef = useRef<HTMLElement>(null)

  const [query, setQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [affiliationFilter, setAffiliationFilter] = useState<string>('ALL')
  const [projectOpen, setProjectOpen] = useState(false)
  const [affiliationOpen, setAffiliationOpen] = useState(false)
  const [people, setPeople] = useState<Person[]>(initialPeople)
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<Person | null>(null)
  const [pending, startTransition] = useTransition()

  // Debounced server search; stale responses are dropped via the request id.
  const didMount = useRef(false)
  const requestId = useRef(0)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    const id = ++requestId.current
    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchPeople({
          query: query.trim().length >= 2 ? query.trim() : '',
          projectId: projectFilter !== 'ALL' ? projectFilter : undefined,
          affiliation: affiliationFilter !== 'ALL' ? affiliationFilter : undefined,
        })
        if (id !== requestId.current) return
        if ('people' in res) {
          setPeople(res.people)
          setExpanded(false)
        }
      })
    }, 350)
    return () => clearTimeout(timer)
  }, [query, projectFilter, affiliationFilter])

  // Pop-up closes on Escape.
  useEffect(() => {
    if (!selected) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [selected])

  const projectTitle = (id: string) => projects.find((p) => p.id === id)?.title ?? id
  const affiliationLabel = (v: string) => tpr(`affiliation.${v}`)
  const personName = (p: Person) => p.name || t('peopleNoName')

  const visible = expanded ? people : people.slice(0, MAX_VISIBLE)
  const hasMore = people.length > MAX_VISIBLE
  const listKey = `${query.trim().toLowerCase()}|${projectFilter}|${affiliationFilter}`

  const dropdownBase = (open: boolean) =>
    `absolute top-full left-0 mt-1 w-full rounded-lg shadow-lg z-10 overflow-hidden ${open ? 'dropdown-enter' : 'hidden'}`
  const dropdownOption =
    'w-full text-left px-3 py-1.5 text-small hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,transparent)] transition-colors cursor-pointer'

  return (
    <section ref={sectionRef} id="dash-personen" aria-labelledby="people-heading" className="px-6 md:px-10 py-10 pb-16 scroll-mt-16">
      <h2 id="people-heading" className="text-small font-semibold opacity-50">
        {t('peopleHeading')}
      </h2>
      <div aria-hidden className="h-px mt-2 mb-4" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />

      {/* Controls — search first, then filters (feed pattern) */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6">
        <div
          className="md:flex-1 flex items-center gap-2 px-4 h-10 rounded-lg text-small bg-[var(--app-white)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))] hover:shadow-sm focus-within:shadow-md focus-within:ring-2"
          style={{ '--tw-ring-color': 'var(--app-accent)' } as React.CSSProperties}
        >
          <Search aria-hidden className="w-[1em] h-[1em] shrink-0 opacity-40" style={{ color: 'var(--app-ink)' }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('peopleSearchPlaceholder')}
            aria-label={t('peopleSearchPlaceholder')}
            className="flex-1 outline-none bg-transparent placeholder:opacity-60"
            style={{ color: 'var(--app-ink)' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="opacity-40 hover:opacity-80 transition-all duration-200 hover:rotate-90 cursor-pointer"
              aria-label={tc('clearSearch')}
            >
              <X className="w-[1em] h-[1em]" style={{ color: 'var(--app-ink)' }} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Project filter */}
          {projects.length > 0 && (
            <div className="relative w-44">
              <button
                type="button"
                onClick={() => { setProjectOpen((v) => !v); setAffiliationOpen(false) }}
                className="w-full flex items-center justify-between gap-1 px-2.5 h-10 rounded-md text-small bg-[var(--app-white)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))] hover:shadow-sm cursor-pointer"
                style={{ color: 'var(--app-ink)' }}
                aria-haspopup="listbox"
                aria-expanded={projectOpen}
              >
                <span className="truncate">{projectFilter === 'ALL' ? t('peopleAllProjects') : projectTitle(projectFilter)}</span>
                <ChevronDown aria-hidden="true" className={`w-3 h-3 shrink-0 opacity-50 transition-transform duration-200 ${projectOpen ? 'rotate-180' : ''}`} />
              </button>
              <div
                className={dropdownBase(projectOpen)}
                style={{ background: 'var(--app-white)', transformOrigin: 'top left' }}
                role="listbox"
                aria-label={t('peopleFilterProject')}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={projectFilter === 'ALL'}
                  onClick={() => { setProjectFilter('ALL'); setProjectOpen(false) }}
                  className={dropdownOption}
                  style={{ color: 'var(--app-ink)' }}
                >
                  {t('peopleAllProjects')}
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={projectFilter === p.id}
                    onClick={() => { setProjectFilter(p.id); setProjectOpen(false) }}
                    className={dropdownOption}
                    style={{ color: 'var(--app-ink)' }}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Affiliation filter */}
          <div className="relative w-44">
            <button
              type="button"
              onClick={() => { setAffiliationOpen((v) => !v); setProjectOpen(false) }}
              className="w-full flex items-center justify-between gap-1 px-2.5 h-10 rounded-md text-small bg-[var(--app-white)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))] hover:shadow-sm cursor-pointer"
              style={{ color: 'var(--app-ink)' }}
              aria-haspopup="listbox"
              aria-expanded={affiliationOpen}
            >
              <span className="truncate">{affiliationFilter === 'ALL' ? t('peopleAllAffiliations') : affiliationLabel(affiliationFilter)}</span>
              <ChevronDown aria-hidden="true" className={`w-3 h-3 shrink-0 opacity-50 transition-transform duration-200 ${affiliationOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              className={dropdownBase(affiliationOpen)}
              style={{ background: 'var(--app-white)', transformOrigin: 'top left' }}
              role="listbox"
              aria-label={t('peopleFilterAffiliation')}
            >
              <button
                type="button"
                role="option"
                aria-selected={affiliationFilter === 'ALL'}
                onClick={() => { setAffiliationFilter('ALL'); setAffiliationOpen(false) }}
                className={dropdownOption}
                style={{ color: 'var(--app-ink)' }}
              >
                {t('peopleAllAffiliations')}
              </button>
              {AFFILIATIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  role="option"
                  aria-selected={affiliationFilter === v}
                  onClick={() => { setAffiliationFilter(v); setAffiliationOpen(false) }}
                  className={dropdownOption}
                  style={{ color: 'var(--app-ink)' }}
                >
                  {affiliationLabel(v)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active filter pills — mirrors the feed pattern */}
      {(projectFilter !== 'ALL' || affiliationFilter !== 'ALL') && (
        <div className="flex items-center gap-2 flex-wrap -mt-4 mb-6">
          {projectFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setProjectFilter('ALL')}
              className="group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-small bg-[var(--app-white)] transition-all duration-200 hover:shadow-sm cursor-pointer"
              style={{ color: 'var(--app-ink)' }}
            >
              <span className="opacity-60">{t('peopleFilterProject')}:</span>
              <span className="font-semibold">{projectTitle(projectFilter)}</span>
              <X aria-hidden className="w-[1em] h-[1em] transition-transform duration-300 group-hover:rotate-90" />
            </button>
          )}
          {affiliationFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setAffiliationFilter('ALL')}
              className="group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-small bg-[var(--app-white)] transition-all duration-200 hover:shadow-sm cursor-pointer"
              style={{ color: 'var(--app-ink)' }}
            >
              <span className="opacity-60">{t('peopleFilterAffiliation')}:</span>
              <span className="font-semibold">{affiliationLabel(affiliationFilter)}</span>
              <X aria-hidden className="w-[1em] h-[1em] transition-transform duration-300 group-hover:rotate-90" />
            </button>
          )}
          {projectFilter !== 'ALL' && affiliationFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => { setProjectFilter('ALL'); setAffiliationFilter('ALL') }}
              className="inline-flex items-center gap-1 text-small underline opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ color: 'var(--app-ink)' }}
            >
              <RotateCcw aria-hidden className="w-[1em] h-[1em]" />
              {ta('resetFilters')}
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className={`transition-opacity duration-200 ${pending ? 'opacity-60' : ''}`}>
        {people.length === 0 ? (
          <p className="text-small" style={{ color: 'var(--app-ink)', opacity: 0.5 }}>
            {t('peopleNoResults')}
          </p>
        ) : (
          <div key={listKey}>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" role="list">
              {visible.map((p, i) => (
                <li key={p.id} className="card-in" style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className="w-full h-full flex items-center gap-3 rounded-lg shadow-sm px-3 py-2 text-left bg-[var(--app-white)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))] hover:shadow-md cursor-pointer"
                  >
                    <Avatar person={p} size="row" />
                    <div className="min-w-0 flex-1">
                      <p className="text-text font-medium leading-snug truncate" style={{ color: 'var(--app-ink-accent)' }}>
                        {personName(p)}
                      </p>
                      <p className="text-small mt-0.5 truncate" style={{ color: 'var(--app-ink)', opacity: 0.6 }}>
                        {[
                          p.sharedProjects.length > 0 ? t('peopleShared', { count: p.sharedProjects.length }) : null,
                          p.affiliations.length > 0 ? p.affiliations.map(affiliationLabel).join(', ') : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="px-4 h-10 rounded-lg text-small font-medium bg-[var(--app-white)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))] hover:shadow-sm cursor-pointer"
                  style={{ color: 'var(--app-ink)' }}
                >
                  {expanded ? t('peopleShowLess') : t('peopleShowMore', { count: people.length - MAX_VISIBLE })}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile pop-up — same dialog language as logout/delete */}
      {selected &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--app-black)_45%,transparent)] backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelected(null)
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={personName(selected)}
              className="popover-in w-full max-w-md rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto"
              style={{ background: 'var(--app-white)', color: 'var(--app-ink)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar person={selected} size="dialog" />
                  <div className="min-w-0">
                    <h2 className="text-display font-bold leading-tight" style={{ color: 'var(--app-ink-accent)' }}>
                      {personName(selected)}
                    </h2>
                    {selected.affiliations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selected.affiliations.map((v) => (
                          <span
                            key={v}
                            className="px-2 py-0.5 rounded-full text-small bg-[var(--app-light)]"
                            style={{ color: 'var(--app-ink)' }}
                          >
                            {affiliationLabel(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label={t('peopleClose')}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))] cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              {selected.bio && (
                <p className="text-small mt-5 whitespace-pre-line" style={{ color: 'var(--app-ink)' }}>
                  {selected.bio}
                </p>
              )}

              {selected.sharedProjects.length > 0 && (
                <div className="mt-5">
                  <p className="text-small font-semibold opacity-50 mb-2">{t('peopleSharedTitle')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.sharedProjects.map((sp) => (
                      <span
                        key={sp.id}
                        className="px-2.5 py-0.5 rounded-full text-small font-medium"
                        style={{ background: sp.light, color: 'var(--app-ink-accent)' }}
                      >
                        {sp.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.galleryUrls.length > 0 && (
                <div className="mt-5">
                  <p className="text-small font-semibold opacity-50 mb-2">{t('peopleGalleryTitle')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.galleryUrls.map((url) => (
                      <div key={url} className="aspect-square rounded-lg overflow-hidden shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" aria-hidden className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
