'use client'

import { useState, useCallback, useRef } from 'react'
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
import { GripVertical, ArrowRight, SquarePen, Users, Asterisk, ChevronLeft, ChevronRight } from 'lucide-react'
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
}: {
  project: PillProject
  isPM: boolean
  locale: string
  tOpenWorkspace: string
  tManageProject: string
  rowHeight: string
  onNavigate: (href: string, coverColor?: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void
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
}: {
  projects: PillProject[]
  roleLabels: Record<string, string>
  locale: string
  tOpenWorkspace: string
  tManageProject: string
  rowHeight: string
}) {
  const t = useTranslations('dashboard')
  const exitNavigate = useDashboardExit()
  const sectionRef = useRef<HTMLElement>(null)
  const [items, setItems] = useState(projects)
  const [page, setPage] = useState(0)

  /** Change page and smooth-scroll back to the section top. */
  const goToPage = useCallback((p: number) => {
    setPage(p)
    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion')
    sectionRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
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
    </section>
  )
}
