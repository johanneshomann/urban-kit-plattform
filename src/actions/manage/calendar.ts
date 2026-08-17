// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import type { CalendarEvent } from '@/payload-types'
import { getProjectManagerContext, getContentAuthorContext } from '@/lib/auth/requireProjectManager'
import { markdownToLexical } from '@/lib/richtext'
import { emitActivity } from '@/lib/events'
import { uniqueSlug } from '@/lib/slugify'

export type CalendarActionState = { error?: string; ok?: boolean }

const VISIBILITIES = new Set(['PUBLIC', 'PROJECT', 'TEAM'])
const vis = (v: unknown): 'PUBLIC' | 'PROJECT' | 'TEAM' => (VISIBILITIES.has(v as string) ? (v as 'PUBLIC' | 'PROJECT' | 'TEAM') : 'PROJECT')


/** Clamp an author's visibility choice: PMs keep theirs, leads are forced to
 * TEAM with tags intersected against the teams they lead (empty → all). */
function clampAuthorVisibility(
  ctx: { isPM: boolean; leadOf: string[] },
  visibility: string | undefined,
  visibilityTeams: string[] | undefined,
): { visibility: 'PUBLIC' | 'PROJECT' | 'TEAM'; visibilityTeams: string[] } {
  if (ctx.isPM) {
    const v = (visibility === 'PUBLIC' || visibility === 'TEAM' ? visibility : 'PROJECT') as 'PUBLIC' | 'PROJECT' | 'TEAM'
    return { visibility: v, visibilityTeams: v === 'TEAM' && Array.isArray(visibilityTeams) ? visibilityTeams : [] }
  }
  const teams = (Array.isArray(visibilityTeams) ? visibilityTeams : []).filter((t) => ctx.leadOf.includes(t))
  return { visibility: 'TEAM', visibilityTeams: teams.length ? teams : ctx.leadOf }
}


const authorIdOf = (doc: unknown): string | null => {
  const a = (doc as { author?: unknown }).author
  return a == null ? null : String(typeof a === 'object' ? (a as { id: unknown }).id : a)
}

export interface EventInput {
  title: string
  startDate: string
  endDate?: string
  allDay?: boolean
  location?: string
  category?: string
  visibility?: string
  visibilityTeams?: string[]
  body?: string
}

function revalidateCalendar(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/inhalte/calendar`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
  revalidatePath(`/${locale}/projekte/${slug}`)
}

async function getProjectEvent(payload: Payload, projectId: string, eventId: string) {
  const ev = await payload.findByID({ collection: 'calendar-events', id: eventId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!ev) return null
  const pid = typeof ev.project === 'object' ? (ev.project as { id: unknown })?.id : ev.project
  return String(pid) === String(projectId) ? ev : null
}

interface EventData {
  title: string
  startDate: string
  endDate: string | null
  allDay: boolean
  location: string | null
  category: string | null
  visibility: 'PUBLIC' | 'PROJECT' | 'TEAM'
  visibilityTeams: string[]
  content: CalendarEvent['content'] | null | undefined
}

/** Validate + normalize the shared event fields. Returns data or an error string. */
async function buildData(input: EventInput): Promise<{ data: EventData } | { error: string }> {
  const title = input.title.trim()
  if (!title) return { error: 'Titel darf nicht leer sein.' }

  const start = new Date(input.startDate)
  if (Number.isNaN(start.getTime())) return { error: 'Bitte ein gültiges Startdatum angeben.' }

  let end: Date | null = null
  if (input.endDate) {
    end = new Date(input.endDate)
    if (Number.isNaN(end.getTime())) return { error: 'Ungültiges Enddatum.' }
    if (end < start) return { error: 'Das Enddatum liegt vor dem Startdatum.' }
  }

  const content = typeof input.body === 'string'
    ? (input.body.trim() ? ((await markdownToLexical(input.body)) as CalendarEvent['content']) : null)
    : undefined

  return {
    data: {
      title,
      startDate: start.toISOString(),
      endDate: end ? end.toISOString() : null,
      allDay: !!input.allDay,
      location: input.location?.trim() || null,
      category: input.category?.trim() || null,
      visibility: vis(input.visibility),
      visibilityTeams: Array.isArray(input.visibilityTeams) ? input.visibilityTeams : [],
      content,
    },
  }
}

export async function createProjectEvent(slug: string, locale: string, input: EventInput): Promise<CalendarActionState> {
  // PMs and team leads may create; leads are clamped to their teams below.
  const ctx = await getContentAuthorContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const built = await buildData(input)
  if ('error' in built) return { error: built.error }
  Object.assign(built.data, clampAuthorVisibility(ctx, input.visibility, input.visibilityTeams))

  try {
    const payload = await getPayload({ config })
    const event = await payload.create({
      collection: 'calendar-events',
      data: {
        ...built.data,
        slug: uniqueSlug(input.title, 'termin'),
        author: ctx.user.id,
        project: ctx.project.id,
      },
      overrideAccess: true,
    })
    await emitActivity({ type: 'calendar.created', userId: String(ctx.user.id), projectId: ctx.project.id, reference: { collectionSlug: 'calendar-events', id: String(event.id) } })
  } catch {
    return { error: 'Termin konnte nicht erstellt werden.' }
  }

  revalidateCalendar(locale, slug)
  return { ok: true }
}

export async function updateProjectEvent(slug: string, locale: string, eventId: string, input: EventInput): Promise<CalendarActionState> {
  const ctx = await getContentAuthorContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const built = await buildData(input)
  if ('error' in built) return { error: built.error }
  Object.assign(built.data, clampAuthorVisibility(ctx, input.visibility, input.visibilityTeams))

  try {
    const payload = await getPayload({ config })
    const existing = await getProjectEvent(payload, ctx.project.id, eventId)
    if (!existing) return { error: 'Termin nicht gefunden.' }
    // Leads only edit their own events.
    if (!ctx.isPM && authorIdOf(existing) !== String(ctx.user.id)) return { error: 'Nur eigene Termine können bearbeitet werden.' }
    await payload.update({
      collection: 'calendar-events',
      id: eventId,
      data: built.data,
      overrideAccess: true,
    })
  } catch {
    return { error: 'Termin konnte nicht gespeichert werden.' }
  }

  revalidateCalendar(locale, slug)
  return { ok: true }
}

export async function deleteProjectEvent(slug: string, locale: string, eventId: string): Promise<CalendarActionState> {
  const ctx = await getContentAuthorContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    const existing = await getProjectEvent(payload, ctx.project.id, eventId)
    if (!existing) return { error: 'Termin nicht gefunden.' }
    if (!ctx.isPM && authorIdOf(existing) !== String(ctx.user.id)) return { error: 'Nur eigene Termine können gelöscht werden.' }
    await payload.delete({ collection: 'calendar-events', id: eventId, overrideAccess: true })
  } catch {
    return { error: 'Termin konnte nicht gelöscht werden.' }
  }

  revalidateCalendar(locale, slug)
  return { ok: true }
}
