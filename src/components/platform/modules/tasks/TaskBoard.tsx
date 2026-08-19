// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'
import { Plus, Pencil, Trash2, Calendar, GripVertical, UserMinus, UserPlus } from 'lucide-react'
import { createTask, updateTask, deleteTask, moveTask, toggleSelfAssignTask } from '@/actions/tasks'
import { SaveButton } from '@/components/platform/SaveButton'
import { ContentItemMenu } from '@/components/platform/ContentItemMenu'
import { AudienceChip } from '@/components/platform/AudienceChip'
import { FormModal } from '@/components/platform/FormModal'
import { ManageMenu } from '@/components/platform/ManageMenu'

export interface TaskMember { id: string; name: string }
export interface TaskCardData {
  id: string; title: string; description: string; status: string; priority: string
  deadline: string | null; labels: string[]; assignees: TaskMember[]
  /** 'PROJECT' = alle Mitglieder sehen sie, 'TEAM' = nur Projektteam. */
  visibility: 'PROJECT' | 'TEAM'
  /** Specific team tags a TEAM task addresses (empty → whole Projektteam). */
  visibilityTeams: string[]
  /** Assigned to the viewer (for the "Meine Aufgaben" toggle). */
  mine: boolean
  canMove: boolean
  /** Edit/delete: PMs always, team members for their own tasks. */
  canManage: boolean
}

const COLUMNS = [
  { id: 'todo', label: 'Offen' },
  { id: 'in_progress', label: 'In Arbeit' },
  { id: 'done', label: 'Erledigt' },
] as const

const PRIORITY = { low: { label: 'Niedrig', bg: 'var(--project-light)', fg: 'var(--project-ink)' }, medium: { label: 'Mittel', bg: 'var(--project-general)', fg: 'var(--project-black)' }, high: { label: 'Hoch', bg: 'var(--project-danger-surface)', fg: 'var(--project-danger)' } } as Record<string, { label: string; bg: string; fg: string }>
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }

const emptyForm = (): TaskCardData => ({ id: '', title: '', description: '', status: 'todo', priority: 'medium', deadline: null, labels: [], assignees: [], visibility: 'TEAM', visibilityTeams: [], mine: false, canMove: true, canManage: true })

function Card({ slug, locale, agentEnabled, task, onOpen, onSelfAssign, onEdit, onDelete, pending }: { slug: string; locale: string; agentEnabled: boolean; task: TaskCardData; onOpen: () => void; onSelfAssign: () => void; onEdit: () => void; onDelete: () => void; pending: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, disabled: !task.canMove })
  const prio = PRIORITY[task.priority] ?? PRIORITY.medium
  return (
    <div ref={setNodeRef} style={{ ...cardStyle, transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-xl border p-3">
      <div className="flex items-start gap-2">
        {task.canMove && <button type="button" {...listeners} {...attributes} className="mt-0.5 cursor-grab touch-none shrink-0" style={{ color: 'var(--project-ink)' }}><GripVertical className="w-4 h-4" /></button>}
        <div className="flex-1 min-w-0">
          {/* Title opens the task popup */}
          <button type="button" onClick={onOpen} className="text-text font-medium leading-snug text-left cursor-pointer hover:underline" style={{ color: 'var(--project-accent)' }}>{task.title}</button>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full" style={{ background: prio.bg, color: prio.fg }}>{prio.label}</span>
            <AudienceChip visibility={task.visibility} visibilityTeams={task.visibilityTeams} />
            {task.labels.map((l) => <span key={l} className="text-[0.7rem] px-2 py-0.5 rounded-full" style={{ background: 'var(--project-light)', color: 'var(--project-accent)' }}>{l}</span>)}
          </div>
          {(task.assignees.length > 0 || task.deadline) && (
            <p className="text-small flex flex-wrap items-center gap-x-2 mt-1.5" style={{ color: 'var(--project-ink)' }}>
              {task.assignees.length > 0 && <span>{task.assignees.map((a) => a.name).join(', ')}</span>}
              {task.deadline && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(task.deadline).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>}
            </p>
          )}
        </div>
        {/* Tasks are member-only — every viewer is logged in, so the bookmark always shows */}
        <div className="shrink-0 flex flex-col items-center">
          <SaveButton slug={slug} module="tasks" itemId={task.id} />
          <ContentItemMenu
            slug={slug}
            locale={locale}
            agentEnabled={agentEnabled}
            item={{ module: 'tasks', itemId: task.id, title: task.title, href: '/m/tasks' }}
            disabled={pending}
            extraItems={[
              task.mine
                ? { key: 'unassign', label: 'Nicht mehr zuständig', icon: UserMinus, onSelect: onSelfAssign }
                : { key: 'assign', label: 'Mir zuweisen', icon: UserPlus, onSelect: onSelfAssign },
              ...(task.canManage
                ? [
                    { key: 'edit', label: 'Bearbeiten', icon: Pencil, onSelect: onEdit },
                    { key: 'delete', label: 'Löschen', icon: Trash2, variant: 'danger' as const, confirmLabel: 'Wirklich löschen?', onSelect: onDelete },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function Column({ id, label, count, children }: { id: string; label: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 rounded-xl p-2 min-h-32 transition-colors" style={{ background: isOver ? 'color-mix(in srgb, var(--project-general) 12%, transparent)' : 'var(--project-light)' }}>
      <p className="text-small font-bold uppercase tracking-widest px-2 pt-1" style={{ color: 'var(--project-ink)' }}>{label} · {count}</p>
      {children}
    </div>
  )
}

export function TaskBoard({ slug, locale, tasks, members, isPM, canCreate, teamOptions = [], agentEnabled = false }: { slug: string; locale: string; tasks: TaskCardData[]; members: TaskMember[]; isPM: boolean; canCreate: boolean; teamOptions?: string[]; agentEnabled?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [local, setLocal] = useState<TaskCardData[]>(tasks)
  const [editing, setEditing] = useState<TaskCardData | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [mineOnly, setMineOnly] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // re-sync local board when the server sends fresh data (after refresh)
  useEffect(() => { setLocal(tasks) }, [tasks])

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn(); if (res.error) { setError(res.error); return }
      after?.(); router.refresh()
    })
  }

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id); const target = e.over ? String(e.over.id) : null
    if (!target) return
    const task = local.find((t) => t.id === id)
    if (!task || task.status === target) return
    setLocal((ls) => ls.map((t) => (t.id === id ? { ...t, status: target } : t))) // optimistic
    startTransition(async () => {
      const res = await moveTask(slug, locale, id, target)
      if (res.error) { setError(res.error); router.refresh() }
      else router.refresh()
    })
  }

  const save = () => {
    if (!editing) return
    const input = { title: editing.title, description: editing.description, status: editing.status, priority: editing.priority, deadline: editing.deadline, labels: editing.labels, assigneeIds: editing.assignees.map((a) => a.id), visibility: editing.visibility, visibilityTeams: editing.visibility === 'TEAM' ? editing.visibilityTeams : [] }
    if (editing.id) run(() => updateTask(slug, locale, editing.id, input), () => setEditing(null))
    else run(() => createTask(slug, locale, input), () => setEditing(null))
  }

  // Column counts respect the toggle — they derive from the filtered list.
  const shown = mineOnly ? local.filter((t) => t.mine) : local

  const setF = <K extends keyof TaskCardData>(k: K, v: TaskCardData[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e))
  const toggleAssignee = (m: TaskMember) => setEditing((e) => e ? { ...e, assignees: e.assignees.some((a) => a.id === m.id) ? e.assignees.filter((a) => a.id !== m.id) : [...e.assignees, m] } : e)

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-1">
        {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
        <h1 className="sr-only">Aufgaben</h1>
        <button type="button" onClick={() => setMineOnly((v) => !v)} aria-pressed={mineOnly}
          className="text-small px-3 py-1.5 rounded-full border transition-colors"
          style={{ background: mineOnly ? 'var(--project-dark)' : 'transparent', color: mineOnly ? 'var(--project-black)' : 'var(--project-accent)', borderColor: mineOnly ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>
          Meine Aufgaben
        </button>
        {canCreate && !editing && (
          <button type="button" onClick={() => setEditing(emptyForm())} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
            <Plus className="w-4 h-4" /> Neue Aufgabe
          </button>
        )}
      </div>
      <p className="text-text mb-6" style={{ color: 'var(--project-ink)' }}>
        {canCreate
          ? 'Aufgaben des Projekts. Aufgaben mit der Markierung „Team" sieht nur das Projektteam, alle anderen sehen alle Mitglieder. Zugewiesene verschieben ihre Aufgaben zwischen den Spalten.'
          : 'Aufgaben des Projekts. Ihnen zugewiesene Aufgaben können Sie zwischen den Spalten verschieben.'}
      </p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}

      {editing && (
        <FormModal title={editing.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'} size="xl" onClose={() => setEditing(null)}>
          <div className="flex flex-col gap-3">
          {error && <p className="text-small px-4 py-2.5 rounded-lg" style={{ color: 'var(--project-danger)', background: 'var(--project-danger-surface)' }}>{error}</p>}
          <input type="text" autoFocus value={editing.title} onChange={(e) => setF('title', e.target.value)} placeholder="Titel …" className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle} />
          <textarea value={editing.description} onChange={(e) => setF('description', e.target.value)} rows={3} placeholder="Beschreibung (Markdown, optional)" className="w-full px-3 py-2 rounded-lg border text-text outline-none font-mono" style={inputStyle} />
          <div className="grid sm:grid-cols-3 gap-2">
            <select value={editing.status} onChange={(e) => setF('status', e.target.value)} className="px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle}>
              {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={editing.priority} onChange={(e) => setF('priority', e.target.value)} className="px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle}>
              <option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option>
            </select>
            <input type="date" value={editing.deadline ?? ''} onChange={(e) => setF('deadline', e.target.value || null)} className="px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle} />
          </div>
          <input type="text" value={editing.labels.join(', ')} onChange={(e) => setF('labels', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="Labels (kommagetrennt)" className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle} />
          <div>
            <p className="text-small font-medium mb-1.5" style={{ color: 'var(--project-accent)' }}>Sichtbar für</p>
            {isPM ? (
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'TEAM', label: 'Nur Projektteam' },
                  { value: 'PROJECT', label: 'Alle Mitglieder' },
                ] as const).map((opt) => {
                  const on = editing.visibility === opt.value
                  return (
                    <button key={opt.value} type="button" onClick={() => setF('visibility', opt.value)} className="text-small px-3 py-1.5 rounded-full border" style={{ background: on ? 'var(--project-dark)' : 'transparent', color: on ? 'var(--project-black)' : 'var(--project-accent)', borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-small" style={{ color: 'var(--project-ink)' }}>Nur Projektteam — allgemeine Aufgaben für alle Mitglieder legen Projektmanager:innen an.</p>
            )}
            {editing.visibility === 'TEAM' && teamOptions.length > 0 && (
              <div className="mt-2">
                <p className="text-small mb-1.5" style={{ color: 'var(--project-ink)' }}>Bestimmte Teams (keine Auswahl = ganzes Projektteam)</p>
                <div className="flex flex-wrap gap-1.5">
                  {teamOptions.map((tag) => {
                    const on = editing.visibilityTeams.includes(tag)
                    return (
                      <button key={tag} type="button" onClick={() => setF('visibilityTeams', on ? editing.visibilityTeams.filter((t) => t !== tag) : [...editing.visibilityTeams, tag])} className="text-small px-2.5 py-1 rounded-full border transition-colors" style={{ background: on ? 'var(--project-dark)' : 'transparent', color: on ? 'var(--project-black)' : 'var(--project-accent)', borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div>
            <p className="text-small font-medium mb-1.5" style={{ color: 'var(--project-accent)' }}>Zuständig</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = editing.assignees.some((a) => a.id === m.id)
                return <button key={m.id} type="button" onClick={() => toggleAssignee(m)} className="text-small px-3 py-1.5 rounded-full border" style={{ background: on ? 'var(--project-dark)' : 'transparent', color: on ? 'var(--project-black)' : 'var(--project-accent)', borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>{m.name}</button>
              })}
              {members.length === 0 && <span className="text-small" style={{ color: 'var(--project-ink)' }}>Keine Mitglieder.</span>}
            </div>
          </div>
          <div>
            <button type="button" onClick={save} disabled={pending || !editing.title.trim()} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
              {editing.id ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editing.id ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
          </div>
        </FormModal>
      )}

      {/* Task detail popup — derived from the board so refreshes flow in */}
      {(() => {
        const t = detailId ? local.find((x) => x.id === detailId) : undefined
        if (!t) return null
        const prio = PRIORITY[t.priority] ?? PRIORITY.medium
        const col = COLUMNS.find((c) => c.id === t.status)
        return (
          <FormModal title={t.title} onClose={() => setDetailId(null)}>
            <div className="flex flex-wrap items-center gap-1.5 -mt-2 mb-3">
              <span className="text-small font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'var(--project-light)', color: 'var(--project-ink)' }}>{col?.label ?? t.status}</span>
              <span className="text-small font-semibold px-2.5 py-0.5 rounded-full" style={{ background: prio.bg, color: prio.fg }}>{prio.label}</span>
              <AudienceChip visibility={t.visibility} visibilityTeams={t.visibilityTeams} />
              {t.labels.map((l) => <span key={l} className="text-small px-2.5 py-0.5 rounded-full" style={{ background: 'var(--project-light)', color: 'var(--project-accent)' }}>{l}</span>)}
              <span className="ml-auto"><SaveButton slug={slug} module="tasks" itemId={t.id} /></span>
            </div>
            <p className="text-small flex flex-wrap items-center gap-x-3 gap-y-0.5" style={{ color: 'var(--project-ink)' }}>
              {t.deadline && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Fällig am {new Date(t.deadline).toLocaleDateString('de-DE', { dateStyle: 'medium' })}</span>}
              {t.assignees.length > 0 && <span>Zuständig: {t.assignees.map((a) => a.name).join(', ')}</span>}
            </p>
            {t.description && (
              <p className="text-text whitespace-pre-wrap mt-4 pt-4 border-t" style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 15%, transparent)' }}>{t.description}</p>
            )}
            {t.canManage && (
              <div className="mt-5">
                <button type="button" onClick={() => { setDetailId(null); setEditing(t) }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-small font-semibold cursor-pointer" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
                  <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                </button>
              </div>
            )}
          </FormModal>
        )
      })()}

      {shown.length === 0 && !editing ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={cardStyle}>
          <p className="text-text" style={{ color: 'var(--project-ink)' }}>
            {canCreate ? 'Noch keine Aufgaben. Erstellen Sie die erste über „Neue Aufgabe".' : 'Noch keine Aufgaben.'}
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COLUMNS.map((col) => {
              const colTasks = shown.filter((t) => t.status === col.id)
              return (
                <Column key={col.id} id={col.id} label={col.label} count={colTasks.length}>
                  {colTasks.length === 0 ? <p className="text-small px-2 py-4 text-center" style={{ color: 'var(--project-ink)' }}>—</p>
                    : colTasks.map((t) => <Card key={t.id} slug={slug} locale={locale} agentEnabled={agentEnabled} task={t} pending={pending} onOpen={() => setDetailId(t.id)} onSelfAssign={() => run(() => toggleSelfAssignTask(slug, locale, t.id))} onEdit={() => setEditing(t)} onDelete={() => run(() => deleteTask(slug, locale, t.id))} />)}
                </Column>
              )
            })}
          </div>
        </DndContext>
      )}
    </div>
  )
}
