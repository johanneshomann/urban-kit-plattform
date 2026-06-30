'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import { getUser } from '@/lib/auth/getUser'
import { getViewerTier } from '@/lib/visibility'

export type FilesActionState = { error?: string; ok?: boolean }

const VIS = new Set(['PUBLIC', 'INTERNAL', 'TEAM'])
const vis = (v: unknown): 'PUBLIC' | 'INTERNAL' | 'TEAM' => (VIS.has(v as string) ? (v as 'PUBLIC' | 'INTERNAL' | 'TEAM') : 'INTERNAL')
const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
const MAX_BYTES = 50 * 1024 * 1024

async function projectBySlug(payload: Payload, slug: string) {
  const res = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  return res.docs[0] as { id: string } | undefined
}

/** Team context — files are managed by PMs + team-flagged members (tier 'team'). */
async function teamCtx(slug: string) {
  const user = await getUser()
  if (!user) return { error: 'Bitte melde dich an.' as const }
  const payload = await getPayload({ config })
  const project = await projectBySlug(payload, slug)
  if (!project) return { error: 'Projekt nicht gefunden.' as const }
  const tier = await getViewerTier(payload, String(user.id), project.id)
  if (tier !== 'team') return { error: 'Nur das Projektteam kann Dateien verwalten.' as const }
  return { payload, user, project }
}

function revalidateFiles(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/inhalte/files`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/m/files`)
  revalidatePath(`/${locale}/projekte/${slug}`)
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function createFolder(slug: string, locale: string, input: { name: string; visibility?: string }): Promise<FilesActionState> {
  const ctx = await teamCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  const name = input.name.trim()
  if (!name) return { error: 'Name darf nicht leer sein.' }
  try {
    await ctx.payload.create({ collection: 'folders', data: { name, visibility: vis(input.visibility), project: ctx.project.id }, overrideAccess: true })
  } catch {
    return { error: 'Ordner konnte nicht erstellt werden.' }
  }
  revalidateFiles(locale, slug)
  return { ok: true }
}

export async function setFolderVisibility(slug: string, locale: string, folderId: string, visibility: string): Promise<FilesActionState> {
  const ctx = await teamCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  try {
    const folder = await ctx.payload.findByID({ collection: 'folders', id: folderId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!folder || relId((folder as { project?: unknown }).project) !== String(ctx.project.id)) return { error: 'Ordner nicht gefunden.' }
    await ctx.payload.update({ collection: 'folders', id: folderId, data: { visibility: vis(visibility) }, overrideAccess: true })
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
  revalidateFiles(locale, slug)
  return { ok: true }
}

export async function deleteFolder(slug: string, locale: string, folderId: string): Promise<FilesActionState> {
  const ctx = await teamCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  try {
    const folder = await ctx.payload.findByID({ collection: 'folders', id: folderId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!folder || relId((folder as { project?: unknown }).project) !== String(ctx.project.id)) return { error: 'Ordner nicht gefunden.' }
    await ctx.payload.delete({ collection: 'file-uploads', where: { folder: { equals: folderId } }, overrideAccess: true })
    await ctx.payload.delete({ collection: 'folders', id: folderId, overrideAccess: true })
  } catch {
    return { error: 'Ordner konnte nicht gelöscht werden.' }
  }
  revalidateFiles(locale, slug)
  return { ok: true }
}

// ─── Files ────────────────────────────────────────────────────────────────────

export async function uploadFile(slug: string, locale: string, formData: FormData): Promise<FilesActionState> {
  const ctx = await teamCtx(slug)
  if ('error' in ctx) return { error: ctx.error }

  const f = formData.get('file')
  if (!(f instanceof File) || f.size === 0) return { error: 'Keine Datei ausgewählt.' }
  if (f.size > MAX_BYTES) return { error: 'Datei ist zu groß (max. 50 MB).' }

  const folderId = (formData.get('folderId') as string) || null
  const visibility = (formData.get('visibility') as string) || 'INTERNAL'
  const label = ((formData.get('label') as string) || '').trim() || undefined

  try {
    // Validate folder belongs to project (if given)
    if (folderId) {
      const folder = await ctx.payload.findByID({ collection: 'folders', id: folderId, depth: 0, overrideAccess: true }).catch(() => null)
      if (!folder || relId((folder as { project?: unknown }).project) !== String(ctx.project.id)) return { error: 'Ordner nicht gefunden.' }
    }
    const data = Buffer.from(await f.arrayBuffer())
    await ctx.payload.create({
      collection: 'file-uploads',
      data: { label, folder: folderId, visibility: vis(visibility), uploadedBy: ctx.user.id, project: ctx.project.id },
      file: { data, mimetype: f.type || 'application/octet-stream', name: f.name, size: f.size },
      overrideAccess: true,
    })
  } catch {
    return { error: 'Datei konnte nicht hochgeladen werden.' }
  }
  revalidateFiles(locale, slug)
  return { ok: true }
}

export async function setFileVisibility(slug: string, locale: string, fileId: string, visibility: string): Promise<FilesActionState> {
  const ctx = await teamCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  try {
    const file = await ctx.payload.findByID({ collection: 'file-uploads', id: fileId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!file || relId((file as { project?: unknown }).project) !== String(ctx.project.id)) return { error: 'Datei nicht gefunden.' }
    await ctx.payload.update({ collection: 'file-uploads', id: fileId, data: { visibility: vis(visibility) }, overrideAccess: true })
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
  revalidateFiles(locale, slug)
  return { ok: true }
}

export async function deleteFile(slug: string, locale: string, fileId: string): Promise<FilesActionState> {
  const ctx = await teamCtx(slug)
  if ('error' in ctx) return { error: ctx.error }
  try {
    const file = await ctx.payload.findByID({ collection: 'file-uploads', id: fileId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!file || relId((file as { project?: unknown }).project) !== String(ctx.project.id)) return { error: 'Datei nicht gefunden.' }
    await ctx.payload.delete({ collection: 'file-uploads', id: fileId, overrideAccess: true })
  } catch {
    return { error: 'Datei konnte nicht gelöscht werden.' }
  }
  revalidateFiles(locale, slug)
  return { ok: true }
}
