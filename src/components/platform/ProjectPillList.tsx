'use client'

import { useState, useCallback } from 'react'
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
import { GripVertical, ArrowRight, SquarePen, Users, Asterisk } from 'lucide-react'
import Link from 'next/link'
import { resolveColorScheme, schemeToCssVars } from '@/lib/colorScheme'
import { reorderProjects } from '@/actions/reorder-projects'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'

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
}: {
  project: PillProject
  isPM: boolean
  locale: string
  tOpenWorkspace: string
  tManageProject: string
  rowHeight: string
}) {
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
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 origin-right"
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
              style={{ background: 'var(--project-dark)', color: 'var(--project-black)' }}
            >
              <Asterisk className="w-[1em] h-[1em] shrink-0" />
              {project.startYear}
            </div>
          )}
          {phaseLabel(project.projektphase) && (
            <div
              className="self-start inline-flex items-center gap-1 px-3 py-1 rounded-md text-small font-normal tracking-widest leading-none"
              style={{ background: 'var(--project-dark)', color: 'var(--project-black)' }}
            >
              <Asterisk className="w-[1em] h-[1em] shrink-0" />
              {phaseLabel(project.projektphase)}
            </div>
          )}
          {project.memberCount != null && project.memberCount > 0 && (
            <div
              className="self-start inline-flex items-center gap-1 px-3 py-1 rounded-md text-small font-normal tracking-widest leading-none"
              style={{ background: 'var(--project-dark)', color: 'var(--project-black)' }}
            >
              <Users className="w-[1em] h-[1em] shrink-0" />
              {project.memberCount}
            </div>
          )}
        </div>

        <h2 className="text-title font-black leading-tight tracking-tight mb-4" style={{ color: 'var(--project-black)' }}>
          {project.title}
        </h2>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/dashboard/projekte/${project.slug}`}
            prefetch={true}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold transition-colors hover:opacity-80"
            style={{
              background: 'var(--project-general)',
              color: 'var(--project-black)',
              minHeight: 44,
            }}
          >
            {tOpenWorkspace}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          {isPM && (
            <Link
              href={`/${locale}/dashboard/projekte/${project.slug}/manage`}
              prefetch={true}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold transition-colors hover:opacity-80"
              style={{
                background: 'var(--project-general)',
                color: 'var(--project-black)',
                minHeight: 44,
              }}
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
          background: 'var(--plattform-ink)',
          color: 'var(--plattform-white)',
          opacity: 0.85,
          boxShadow: '0 2px 8px color-mix(in srgb, var(--plattform-ink) 35%, transparent)',
        }}
        aria-label="Reihenfolge ändern"
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
  const [items, setItems] = useState(projects)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
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
    <section aria-labelledby="my-projects" className="flex flex-col gap-4 px-6 md:px-10 py-10" style={{ minHeight: '60vh' }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((p) => p.membershipId)} strategy={verticalListSortingStrategy}>
          {items.map((project) => (
            <SortablePill
              key={project.membershipId}
              project={project}
              isPM={project.role === 'PM'}
              locale={locale}
              tOpenWorkspace={tOpenWorkspace}
              tManageProject={tManageProject}
              rowHeight={rowHeight}
            />
          ))}
        </SortableContext>
      </DndContext>
    </section>
  )
}