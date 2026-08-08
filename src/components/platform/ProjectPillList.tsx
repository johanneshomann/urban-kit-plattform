'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ArrowRight, ArrowUpRight, ExternalLink, Lightbulb, SquarePen, Users, Asterisk, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { IconTooltip } from '@/components/platform/IconTooltip'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { resolveColorScheme, schemeToCssVars } from '@/lib/colorScheme'
import { reorderProjects } from '@/actions/reorder-projects'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import { useDashboardExit, isPlainLeftClick } from '@/components/platform/DashboardTransition'

type PillProject = {
  membershipId: string
  projectId: string
  title: string
  slug: string
  role: string
  coverImageUrl?: string | null
  colorScheme?: string | null
  startYear?: number
  projektphase?: string
  memberCount?: number
}

/** Suggested method from the Methodensammlung (fetched server-side, keyed by phase). */
export type MethodSuggestion = {
  id: string
  title: string
  slug?: string | null
  auszug?: string | null
}

const PAGE_SIZE = 3

/** Resolve the German phase label from a phase value. */
function phaseLabel(value: string | undefined): string | null {
  if (!value) return null
  const phase = PROJEKTPHASEN.find((p) => p.value === value)
  return phase ? `${phase.step + 1}. ${phase.label.de}` : null
}

function SortablePill({
  project,
  isPM,
  locale,
  tOpenWorkspace,
  tManageProject,
  rowHeight,
  onNavigate,
  onOpenMethods,
}: {
  project: PillProject
  isPM: boolean
  locale: string
  tOpenWorkspace: string
  tManageProject: string
  rowHeight: string
  onNavigate: (href: string, coverColor?: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void
  /** PM-only: opens the phase-based method suggestions popup for this project. */
  onOpenMethods?: () => void
}) {
  const t = useTranslations('dashboard')
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.membershipId,
    disabled: false,
  })

  const scheme = resolveColorScheme(project.colorScheme)

  const style: React.CSSProperties = {
    ...schemeToCssVars(scheme),
    minHeight: rowHeight,
    background: 'var(--project-light)',
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : 1,
  }

  const workspaceHref = `/${locale}/dashboard/projekte/${project.slug}`
  const manageHref = `${workspaceHref}/manage`

  return (
    <div
      ref={setNodeRef}
      data-project-theme
      className="group relative flex flex-col justify-end overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
      style={style}
    >
      {/* Cover */}
      {project.coverImageUrl && (
        <div
          className="absolute inset-y-0 right-0 w-full md:w-1/2 h-full transition-all duration-500 grayscale contrast-75 group-hover:grayscale-0 group-hover:contrast-100"
          style={{
            WebkitMaskImage: `linear-gradient(to right, transparent 0%, black 35%)`,
            maskImage: `linear-gradient(to right, transparent 0%, black 35%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.coverImageUrl}
            alt=""
            aria-hidden
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] origin-right"
          />
        </div>
      )}

      {/* Title + eyebrows + actions */}
      <div className="relative z-10 p-6 md:p-10">
        {/* Eyebrow row: start year · phase · member count — same styling as
            the Bereich hero eyebrows (EyebrowBadge), using the project's
            scheme dark/white colours. */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {project.startYear && (
            <div
              className="self-start inline-flex items-center gap-1 px-3 py-1 rounded-md text-small font-normal tracking-widest leading-none"
              style={{ background: 'var(--project-general)', color: 'var(--project-black)' }}
            >
              <Asterisk className="w-[1em] h-[1em] shrink-0" />
              {project.startYear}
            </div>
          )}
          {phaseLabel(project.projektphase) && (
            <div
              className="self-start inline-flex items-center gap-1 px-3 py-1 rounded-md text-small font-normal tracking-widest leading-none"
              style={{ background: 'var(--project-general)', color: 'var(--project-black)' }}
            >
              <Asterisk className="w-[1em] h-[1em] shrink-0" />
              {phaseLabel(project.projektphase)}
            </div>
          )}
          {project.memberCount != null && project.memberCount > 0 && (
            <div
              className="self-start inline-flex items-center gap-1 px-3 py-1 rounded-md text-small font-normal tracking-widest leading-none"
              style={{ background: 'var(--project-general)', color: 'var(--project-black)' }}
            >
              <Users className="w-[1em] h-[1em] shrink-0" />
              {project.memberCount}
            </div>
          )}
        </div>

        <h3 className="text-title font-black leading-tight tracking-tight mb-4" style={{ color: 'var(--project-black)' }}>
          {project.title}
        </h3>

        <div className="flex flex-wrap gap-2">
          <Link
            href={workspaceHref}
            prefetch={true}
            onClick={onNavigate(workspaceHref, scheme.light)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold"
            style={{
              background: 'var(--project-general)',
              color: 'var(--project-black)',
              minHeight: 44,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--project-dark)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--project-general)' }}
          >
            {tOpenWorkspace}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          {isPM && (
            <Link
              href={manageHref}
              prefetch={true}
              onClick={onNavigate(manageHref, scheme.white)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold"
              style={{
                background: 'var(--project-general)',
                color: 'var(--project-black)',
                minHeight: 44,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--project-dark)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--project-general)' }}
            >
              {tManageProject}
              <SquarePen className="w-4 h-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>

      {/* Method suggestions — PM-only, top right over the cover */}
      {isPM && onOpenMethods && (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
          <IconTooltip label={t('methodsTooltip')}>
            <button
              type="button"
              onClick={onOpenMethods}
              aria-label={t('methodsTooltip')}
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 shadow-sm"
              style={{ background: 'var(--project-general)', color: 'var(--project-black)', transition: 'background-color 0.2s, transform 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--project-dark)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--project-general)' }}
            >
              <Lightbulb className="w-5 h-5" aria-hidden />
            </button>
          </IconTooltip>
        </div>
      )}

      {/* Drag handle — right side, only this triggers the sortable drag */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute top-1/2 -translate-y-1/2 right-3 md:right-4 flex items-center justify-center w-9 h-14 md:w-10 md:h-16 rounded-full z-20 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
        style={{
          cursor: 'grab',
          background: 'var(--app-ink)',
          color: 'var(--app-white)',
          opacity: 0.85,
          boxShadow: '0 2px 8px color-mix(in srgb, var(--app-ink) 35%, transparent)',
        }}
        aria-label={t('reorderProjects')}
      >
        <GripVertical className="w-5 h-5" aria-hidden />
      </div>
    </div>
  )
}

export function ProjectPillList({
  projects,
  locale,
  tOpenWorkspace,
  tManageProject,
  rowHeight,
  methodSuggestions,
  methodenBaseUrl,
}: {
  projects: PillProject[]
  roleLabels: Record<string, string>
  locale: string
  tOpenWorkspace: string
  tManageProject: string
  rowHeight: string
  /** Suggested methods per Projektphase value (PM cards only). */
  methodSuggestions?: Record<string, MethodSuggestion[]>
  methodenBaseUrl?: string
}) {
  const t = useTranslations('dashboard')
  const exitNavigate = useDashboardExit()
  const sectionRef = useRef<HTMLElement>(null)
  const [items, setItems] = useState(projects)
  const [page, setPage] = useState(0)

  // Method-suggestions popup (PM-only, opened from a card's top-right icon).
  const [methodsFor, setMethodsFor] = useState<PillProject | null>(null)
  useEffect(() => {
    if (!methodsFor) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMethodsFor(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [methodsFor])

  /**
   * Switch the page immediately (instant click feedback), then scroll back to
   * the section top only if it is out of view (above or under the sticky bar).
   */
  const goToPage = useCallback((p: number) => {
    setPage(p)
    const el = sectionRef.current
    if (!el) return
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop || '0') || 0
    if (el.getBoundingClientRect().top >= margin - 1) return
    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion')
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [])

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = items.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
  )

  const onNavigate = useCallback(
    (href: string, coverColor?: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!exitNavigate || !isPlainLeftClick(e)) return
      e.preventDefault()
      exitNavigate(href, coverColor)
    },
    [exitNavigate],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = items.findIndex((i) => i.membershipId === active.id)
      const newIndex = items.findIndex((i) => i.membershipId === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...items]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)
      setItems(reordered)

      const ids = reordered.map((p) => p.membershipId)
      await reorderProjects(ids)
    },
    [items],
  )

  if (items.length === 0) return null

  return (
    <section ref={sectionRef} id="dash-meine-projekte" aria-labelledby="my-projects" className="flex flex-col gap-4 px-6 md:px-10 py-10 scroll-mt-14" style={{ minHeight: '60vh' }}>
      <div>
        <h2 id="my-projects" className="text-small font-semibold opacity-50">
          {t('sectionMine')}
        </h2>
        <div aria-hidden className="h-px mt-2" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pageItems.map((p) => p.membershipId)} strategy={verticalListSortingStrategy}>
          {/* Keyed on the page index so the card-in stagger replays per page */}
          <div key={safePage} className="flex flex-col gap-4">
            {pageItems.map((project, i) => (
              <div key={project.membershipId} className="card-in" style={{ animationDelay: `${i * 60}ms` }}>
                <SortablePill
                  project={project}
                  isPM={project.role === 'PM'}
                  locale={locale}
                  tOpenWorkspace={tOpenWorkspace}
                  tManageProject={tManageProject}
                  rowHeight={rowHeight}
                  onNavigate={onNavigate}
                  onOpenMethods={methodenBaseUrl ? () => setMethodsFor(project) : undefined}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Pagination — only past 4 projects */}
      {pageCount > 1 && (
        <nav aria-label={t('sectionMine')} className="flex items-center justify-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => goToPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            aria-label={t('paginationPrev')}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 enabled:hover:scale-110 enabled:hover:shadow-md enabled:cursor-pointer disabled:opacity-30"
            style={{ background: 'var(--app-white)', color: 'var(--app-ink-accent)', boxShadow: '0 1px 3px color-mix(in srgb, var(--app-ink) 20%, transparent)' }}
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
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 enabled:hover:scale-110 enabled:hover:shadow-md enabled:cursor-pointer disabled:opacity-30"
            style={{ background: 'var(--app-white)', color: 'var(--app-ink-accent)', boxShadow: '0 1px 3px color-mix(in srgb, var(--app-ink) 20%, transparent)' }}
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
        </nav>
      )}

      {/* Method suggestions popup — project-colored rows in the standard
          dialog shell; portalled so the transition wrapper can't hijack it. */}
      {methodsFor &&
        methodenBaseUrl &&
        (() => {
          const scheme = resolveColorScheme(methodsFor.colorScheme)
          const suggestions = methodSuggestions?.[methodsFor.projektphase ?? ''] ?? []
          const phase = phaseLabel(methodsFor.projektphase)
          return createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--app-black)_45%,transparent)] backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) setMethodsFor(null)
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="methods-popup-title"
                className="popover-in w-full max-w-md rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto"
                style={{ background: 'var(--app-white)', color: 'var(--app-ink)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2 id="methods-popup-title" className="text-display font-bold" style={{ color: 'var(--app-ink-accent)' }}>
                    {t('methodsTitle')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setMethodsFor(null)}
                    aria-label={t('methodsClose')}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))] cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <p className="text-small opacity-70 mb-5">
                  {phase ? t('methodsForPhase', { phase }) : methodsFor.title}
                </p>

                {suggestions.length === 0 ? (
                  <p className="text-small opacity-50">{t('methodsEmpty')}</p>
                ) : (
                  <ul className="flex flex-col gap-2" role="list">
                    {suggestions.map((m) => (
                      <li key={m.id}>
                        <a
                          href={`${methodenBaseUrl}/${locale}/methods/${m.slug ?? ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-lg shadow-sm px-3 py-2 group/method"
                          style={{ background: scheme.light }}
                        >
                          <div className="min-w-0">
                            <p className="text-text font-medium leading-snug flex items-start gap-2" style={{ color: 'var(--app-ink-accent)' }}>
                              <Lightbulb aria-hidden className="h-4 w-4 shrink-0 mt-0.5" style={{ color: scheme.accent }} />
                              <span className="min-w-0">{m.title}</span>
                            </p>
                            {m.auszug && (
                              <p className="text-small mt-0.5 line-clamp-2" style={{ color: 'var(--app-ink)', opacity: 0.6 }}>
                                {m.auszug}
                              </p>
                            )}
                          </div>
                          <span
                            aria-hidden
                            className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg"
                            style={{ background: scheme.general, color: scheme.accent, transition: 'background-color 0.2s' }}
                          >
                            <ArrowUpRight className="h-5 w-5" />
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                <a
                  href={`${methodenBaseUrl}/${locale}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-1.5 text-small underline transition-opacity hover:opacity-70"
                  style={{ color: 'var(--app-accent)' }}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {t('methodsOpenArchive')}
                </a>
              </div>
            </div>,
            document.body,
          )
        })()}
    </section>
  )
}
