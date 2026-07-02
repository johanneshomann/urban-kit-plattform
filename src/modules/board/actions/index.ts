'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'

export type BoardActionState = { error?: string; ok?: boolean; boardId?: string }

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

function revalidateBoard() {
  revalidatePath('/', 'layout')
}

/** Confirm a board belongs to the PM's project. */
async function getProjectBoard(payload: Payload, projectId: string, boardId: string) {
  const b = await payload.findByID({ collection: 'board-canvases', id: boardId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!b || relId((b as { project?: unknown }).project) !== String(projectId)) return null
  return b
}

/** PM creates a named board for the project. */
export async function createBoard(slug: string, name: string): Promise<BoardActionState> {
  const pm = await getProjectManagerContext(slug)
  if (!pm) return { error: 'Nur Projektmanager:innen können Boards erstellen.' }
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name darf nicht leer sein.' }
  try {
    const payload = await getPayload({ config })
    const board = await payload.create({ collection: 'board-canvases', data: { name: trimmed, project: pm.project.id }, overrideAccess: true })
    revalidateBoard()
    return { ok: true, boardId: String(board.id) }
  } catch {
    return { error: 'Board konnte nicht erstellt werden.' }
  }
}

/** PM renames a board. */
export async function renameBoard(slug: string, boardId: string, name: string): Promise<BoardActionState> {
  const pm = await getProjectManagerContext(slug)
  if (!pm) return { error: 'Keine Berechtigung.' }
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name darf nicht leer sein.' }
  try {
    const payload = await getPayload({ config })
    if (!(await getProjectBoard(payload, pm.project.id, boardId))) return { error: 'Board nicht gefunden.' }
    await payload.update({ collection: 'board-canvases', id: boardId, data: { name: trimmed }, overrideAccess: true })
    revalidateBoard()
    return { ok: true }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/** PM deletes a board (and its persisted Yjs state). */
export async function deleteBoard(slug: string, boardId: string): Promise<BoardActionState> {
  const pm = await getProjectManagerContext(slug)
  if (!pm) return { error: 'Keine Berechtigung.' }
  try {
    const payload = await getPayload({ config })
    if (!(await getProjectBoard(payload, pm.project.id, boardId))) return { error: 'Board nicht gefunden.' }
    await payload.delete({ collection: 'board-canvases', id: boardId, overrideAccess: true })
    revalidateBoard()
    return { ok: true }
  } catch {
    return { error: 'Board konnte nicht gelöscht werden.' }
  }
}
