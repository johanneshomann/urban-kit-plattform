'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'
import { Plus, X, Pencil, Trash2, Calendar, GripVertical } from 'lucide-react'
import { createTask, updateTask, deleteTask, moveTask } from '@/actions/tasks'

export interface TaskMember { id: string; name: string }
export interface TaskCardData {
  id: string; title: string; description: string; status: string; priority: string
  deadline: string | null; labels: string[]; assignees: TaskMember[]; canMove: boolean
}

const COLUMNS = [
  { id: 'todo', label: 'Offen' },
  { id: 'in_progress', label: 'In Arbeit' },
  { id: 'done', label: 'Erledigt' },
] as const

const PRIORITY = { low: { label: 'Niedrig', bg: '#f3f4f6', fg: '#4b5563' }, medium: { label: 'Mittel', bg: '#fef9c3', fg: '#854d0e' }, high: { label: 'Hoch', bg: '#fee2e2', fg: '#b91c1c' } } as Record<string, { label: string; bg: string; fg: string }>
const cardStyle = { background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-mid) 20%, transparent)' }
const inputStyle = { borderColor: 'color-mix(in srgb, var(--project-mid) 30%, transparent)', color: 'var(--project-dark)', background: 'var(--project-white)' }

const emptyForm = (): TaskCardData => ({ id: '', title: '', description: '', status: 'todo', priority: 'medium', deadline: null, labels: [], assignees: [], canMove: true })

function Card({ task, isPM, onEdit, onDelete, pending }: { task: TaskCardData; isPM: boolean; onEdit: () => void; onDelete: () => void; pending: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, disabled: !task.canMove })
  const prio = PRIORITY[task.priority] ?? PRIORITY.medium
  return (
    <div ref={setNodeRef} style={{ ...cardStyle, transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-xl border p-3">
      <div className="flex items-start gap-2">
        {task.canMove && <button type="button" {...listeners} {...attributes} className="mt-0.5 cursor-grab touch-none shrink-0" style={{ color: 'var(--project-mid)' }}><GripVertical className="w-4 h-4" /></button>}
        <div className="flex-1 min-w-0">
          <p className="text-text font-medium leading-snug" style={{ color: 'var(--project-dark)' }}>{task.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full" style={{ background: prio.bg, color: prio.fg }}>{prio.label}</span>
            {task.labels.map((l) => <span key={l} className="text-[0.7rem] px-2 py-0.5 rounded-full" style={{ background: 'var(--project-light)', color: 'var(--project-dark)' }}>{l}</span>)}
          </div>
          {(task.assignees.length > 0 || task.deadline) && (
            <p className="text-small flex flex-wrap items-center gap-x-2 mt-1.5" style={{ color: 'var(--project-dark)', opacity: 0.55 }}>
              {task.assignees.length > 0 && <span>{task.assignees.map((a) => a.name).join(', ')}</span>}
              {task.deadline && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(task.deadline).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>}
            </p>
          )}
        </div>
        {isPM && (
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" onClick={onEdit} disabled={pending} title="Bearbeiten" className="p-1 rounded disabled:opacity-40" style={{ color: 'var(--project-dark)' }}><Pencil className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={onDelete} disabled={pending} title="Löschen" className="p-1 rounded disabled:opacity-40" style={{ color: '#b91c1c' }}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  )
}

function Column({ id, label, count, children }: { id: string; label: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 rounded-xl p-2 min-h-32 transition-colors" style={{ background: isOver ? 'color-mix(in srgb, var(--project-mid) 12%, transparent)' : 'var(--project-light)' }}>
      <p className="text-small font-bold uppercase tracking-widest px-2 pt-1" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{label} · {count}</p>
      {children}
    </div>
  )
}

export function TaskBoard({ slug, locale, tasks, members, isPM }: { slug: string; locale: string; tasks: TaskCardData[]; members: TaskMember[]; isPM: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [local, setLocal] = useState<TaskCardData[]>(tasks)
  const [editing, setEditing] = useState<TaskCardData | null>(null)
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
    const input = { title: editing.title, description: editing.description, status: editing.status, priority: editing.priority, deadline: editing.deadline, labels: editing.labels, assigneeIds: editing.assignees.map((a) => a.id) }
    if (editing.id) run(() => updateTask(slug, locale, editing.id, input), () => setEditing(null))
    else run(() => createTask(slug, locale, input), () => setEditing(null))
  }

  const setF = <K extends keyof TaskCardData>(k: K, v: TaskCardData[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e))
  const toggleAssignee = (m: TaskMember) => setEditing((e) => e ? { ...e, assignees: e.assignees.some((a) => a.id === m.id) ? e.assignees.filter((a) => a.id !== m.id) : [...e.assignees, m] } : e)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-title font-bold leading-tight" style={{ color: 'var(--project-dark)' }}>Aufgaben</h1>
        {isPM && !editing && (
          <button type="button" onClick={() => setEditing(emptyForm())} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
            <Plus className="w-4 h-4" /> Neue Aufgabe
          </button>
        )}
      </div>
      <p className="text-text mb-6" style={{ color: 'var(--project-dark)', opacity: 0.65 }}>Internes Aufgabenboard des Projektteams. Zugewiesene ziehen ihre Aufgaben zwischen den Spalten.</p>

      {error && <p className="text-small mb-4 px-4 py-2.5 rounded-lg" style={{ color: '#b91c1c', background: '#fef2f2' }}>{error}</p>}

      {editing && (
        <div className="rounded-xl border p-5 mb-6 flex flex-col gap-3" style={cardStyle}>
          <div className="flex items-center justify-between">
            <h2 className="text-small font-bold uppercase tracking-widest" style={{ color: 'var(--project-dark)', opacity: 0.5 }}>{editing.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</h2>
            <button type="button" onClick={() => setEditing(null)} className="p-1 rounded" style={{ color: 'var(--project-dark)', opacity: 0.6 }}><X className="w-4 h-4" /></button>
          </div>
          <input type="text" value={editing.title} onChange={(e) => setF('title', e.target.value)} placeholder="Titel …" className="w-full px-3 py-2 rounded-lg border text-text outline-none" style={inputStyle} />
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
            <p className="text-small font-medium mb-1.5" style={{ color: 'var(--project-dark)' }}>Zuständig</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = editing.assignees.some((a) => a.id === m.id)
                return <button key={m.id} type="button" onClick={() => toggleAssignee(m)} className="text-small px-3 py-1.5 rounded-full border" style={{ background: on ? 'var(--project-dark)' : 'transparent', color: on ? 'var(--project-white)' : 'var(--project-dark)', borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-mid) 35%, transparent)' }}>{m.name}</button>
              })}
              {members.length === 0 && <span className="text-small" style={{ color: 'var(--project-dark)', opacity: 0.4 }}>Keine Mitglieder.</span>}
            </div>
          </div>
          <div>
            <button type="button" onClick={save} disabled={pending || !editing.title.trim()} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40" style={{ background: 'var(--project-dark)', color: 'var(--project-white)' }}>
              {editing.id ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editing.id ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {COLUMNS.map((col) => {
            const colTasks = local.filter((t) => t.status === col.id)
            return (
              <Column key={col.id} id={col.id} label={col.label} count={colTasks.length}>
                {colTasks.length === 0 ? <p className="text-small px-2 py-4 text-center" style={{ color: 'var(--project-dark)', opacity: 0.35 }}>—</p>
                  : colTasks.map((t) => <Card key={t.id} task={t} isPM={isPM} pending={pending} onEdit={() => setEditing(t)} onDelete={() => run(() => deleteTask(slug, locale, t.id))} />)}
              </Column>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
