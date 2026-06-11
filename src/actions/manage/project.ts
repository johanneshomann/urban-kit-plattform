'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getProjectManagerContext, type ProjectManagerContext } from '@/lib/auth/requireProjectManager'
import {
  THEMA_VALUES, STADTBEREICH_VALUES, ALTERSGRUPPE_VALUES, GENDER_VALUES,
} from '@/lib/options/project-fields'
import { PROJEKTPHASEN } from '@/lib/options/projektphasen'
import { MODULE_ORDER } from '@/lib/options/modules'
import { defaultColorSchemes } from '@/lib/defaults/colorSchemes'
import { markdownToLexical } from '@/lib/richtext'
import type { Payload } from 'payload'

export type ManageActionState = { error?: string; ok?: boolean }

const MAX_IMAGE_BYTES = 12 * 1024 * 1024

/** Convert an uploaded web File into Payload's in-memory file shape, or an error. */
async function readImage(formData: FormData): Promise<{ file: { data: Buffer; mimetype: string; name: string; size: number } } | { error: string }> {
  const f = formData.get('file')
  if (!(f instanceof File) || f.size === 0) return { error: 'Keine Datei ausgewählt.' }
  if (!f.type.startsWith('image/')) return { error: 'Nur Bilddateien sind erlaubt.' }
  if (f.size > MAX_IMAGE_BYTES) return { error: 'Bild ist zu groß (max. 12 MB).' }
  const data = Buffer.from(await f.arrayBuffer())
  return { file: { data, mimetype: f.type, name: f.name, size: f.size } }
}

async function uploadMedia(payload: Payload, ctx: ProjectManagerContext, file: { data: Buffer; mimetype: string; name: string; size: number }, alt: string): Promise<string> {
  const media = await payload.create({
    collection: 'media',
    data: { alt, visibility: 'PUBLIC', project: ctx.project.id, uploadedBy: ctx.user.id },
    file,
    overrideAccess: true,
  })
  return String(media.id)
}

const PHASE_VALUES = new Set(PROJEKTPHASEN.map((p) => p.value))
const SCHEME_NAMES = new Set(defaultColorSchemes.map((s) => s.name))

const filterAllowed = (vals: unknown, allowed: ReadonlySet<string>): string[] =>
  Array.isArray(vals) ? vals.filter((v): v is string => typeof v === 'string' && allowed.has(v)) : []

const cleanStr = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length ? t : undefined
}

function revalidateProject(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/allgemein`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/darstellung`)
}

export interface ProjectSettingsInput {
  title: string
  shortDescription?: string
  startYear?: number | null
  projektphase?: string
  thema?: string[]
  stadtbereich?: string[]
  altersgruppe?: string[]
  gender?: string[]
  kontakt?: { email?: string; telefon?: string; website?: string }
  /** Markdown — converted to Lexical on save. */
  projektbeschreibung?: string
  beteiligungsvorhaben?: string
  /** User id of the contact person, '' / null to clear. */
  ansprechperson?: string | null
}

export async function updateProjectSettings(
  slug: string,
  locale: string,
  input: ProjectSettingsInput,
): Promise<ManageActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const title = cleanStr(input.title)
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  const year = input.startYear
  const startYear = typeof year === 'number' && Number.isFinite(year) ? Math.trunc(year) : null

  const data: Record<string, unknown> = {
    title,
    shortDescription: cleanStr(input.shortDescription) ?? '',
    startYear,
    thema: filterAllowed(input.thema, THEMA_VALUES),
    stadtbereich: filterAllowed(input.stadtbereich, STADTBEREICH_VALUES),
    altersgruppe: filterAllowed(input.altersgruppe, ALTERSGRUPPE_VALUES),
    gender: filterAllowed(input.gender, GENDER_VALUES),
    kontakt: {
      email: cleanStr(input.kontakt?.email) ?? null,
      telefon: cleanStr(input.kontakt?.telefon) ?? null,
      website: cleanStr(input.kontakt?.website) ?? null,
    },
  }
  if (input.projektphase && PHASE_VALUES.has(input.projektphase)) {
    data.projektphase = input.projektphase // collection hook re-derives `status`
  }

  if (typeof input.projektbeschreibung === 'string') {
    data.projektbeschreibung = await markdownToLexical(input.projektbeschreibung)
  }
  if (typeof input.beteiligungsvorhaben === 'string') {
    data.beteiligungsvorhaben = await markdownToLexical(input.beteiligungsvorhaben)
  }

  try {
    const payload = await getPayload({ config })

    // ansprechperson: accept a valid user id, or clear
    if (input.ansprechperson !== undefined) {
      const id = cleanStr(input.ansprechperson ?? undefined)
      if (!id) {
        data.ansprechperson = null
      } else {
        const user = await payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true }).catch(() => null)
        data.ansprechperson = user ? id : null
      }
    }

    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Änderungen konnten nicht gespeichert werden.' }
  }

  revalidateProject(locale, slug)
  return { ok: true }
}

// ─── Cover image ──────────────────────────────────────────────────────────────

export async function updateProjectCover(slug: string, locale: string, formData: FormData): Promise<ManageActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const parsed = await readImage(formData)
  if ('error' in parsed) return { error: parsed.error }

  try {
    const payload = await getPayload({ config })
    const mediaId = await uploadMedia(payload, ctx, parsed.file, `Titelbild – ${ctx.project.title}`)
    const data: Record<string, unknown> = { coverImage: mediaId }
    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Titelbild konnte nicht hochgeladen werden.' }
  }

  revalidateProject(locale, slug)
  return { ok: true }
}

export async function removeProjectCover(slug: string, locale: string): Promise<ManageActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }
  try {
    const payload = await getPayload({ config })
    const data: Record<string, unknown> = { coverImage: null }
    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Titelbild konnte nicht entfernt werden.' }
  }
  revalidateProject(locale, slug)
  return { ok: true }
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function addGalleryImage(slug: string, locale: string, formData: FormData): Promise<ManageActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const parsed = await readImage(formData)
  if ('error' in parsed) return { error: parsed.error }

  try {
    const payload = await getPayload({ config })
    const mediaId = await uploadMedia(payload, ctx, parsed.file, `Galerie – ${ctx.project.title}`)

    const current = await payload.findByID({ collection: 'projects', id: ctx.project.id, depth: 0, overrideAccess: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (((current as any).gallery ?? []) as Array<{ image: unknown; caption?: string | null }>)
      .map((row) => ({ image: typeof row.image === 'object' && row.image ? (row.image as { id: unknown }).id : row.image, caption: row.caption ?? '' }))

    const data: Record<string, unknown> = { gallery: [...existing, { image: mediaId, caption: '' }] }
    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Bild konnte nicht hinzugefügt werden.' }
  }

  revalidateProject(locale, slug)
  return { ok: true }
}

/** Persist the full gallery — handles reorder, caption edits and removals. */
export async function saveProjectGallery(
  slug: string,
  locale: string,
  rows: Array<{ image: string; caption?: string }>,
): Promise<ManageActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const gallery = (Array.isArray(rows) ? rows : [])
    .filter((r) => r && typeof r.image === 'string' && r.image.length > 0)
    .map((r) => ({ image: r.image, caption: cleanStr(r.caption) ?? '' }))

  try {
    const payload = await getPayload({ config })
    const data: Record<string, unknown> = { gallery }
    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Galerie konnte nicht gespeichert werden.' }
  }

  revalidateProject(locale, slug)
  return { ok: true }
}

// ─── Modules ──────────────────────────────────────────────────────────────────

const MODULE_VALUES = new Set<string>(MODULE_ORDER)

/** Enable/disable project modules. News & Kalender are always kept on. */
export async function setProjectModules(
  slug: string,
  locale: string,
  modules: string[],
): Promise<ManageActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const selected = filterAllowed(modules, MODULE_VALUES)
  // Core modules cannot be disabled — the dashboard assumes they exist.
  const withCore = MODULE_ORDER.filter((m) => m === 'news' || m === 'calendar' || selected.includes(m))

  try {
    const payload = await getPayload({ config })
    const data: Record<string, unknown> = { modules: withCore }
    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Module konnten nicht gespeichert werden.' }
  }

  revalidateProject(locale, slug)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/module`)
  return { ok: true }
}

export async function updateProjectAppearance(
  slug: string,
  locale: string,
  input: { colorScheme: string },
): Promise<ManageActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  if (!SCHEME_NAMES.has(input.colorScheme)) return { error: 'Unbekanntes Farbschema.' }

  try {
    const payload = await getPayload({ config })
    const data: Record<string, unknown> = { colorScheme: input.colorScheme }
    await payload.update({ collection: 'projects', id: ctx.project.id, data, overrideAccess: true })
  } catch {
    return { error: 'Farbschema konnte nicht gespeichert werden.' }
  }

  revalidateProject(locale, slug)
  return { ok: true }
}
