'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import type { CalendarEvent } from '@/payload-types'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { markdownToLexical } from '@/lib/richtext'
import { emitActivity } from '@/lib/events'
import { uniqueSlug } from '@/lib/slugify'

export type CalendarActionState = { error?: string; ok?: boolean }

const VISIBILITIES = new Set(['PUBLIC', 'INTERNAL', 'TEAM'])
const vis = (v: unknown): 'PUBLIC' | 'INTERNAL' | 'TEAM' => (VISIBILITIES.has(v as string) ? (v as 'PUBLIC' | 'INTERNAL' | 'TEAM') : 'INTERNAL')

export interface EventInput {
  title: string
  startDate: string
  endDate?: string
  allDay?: boolean
  location?: string
  category?: string
  visibility?: string
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
  visibility: 'PUBLIC' | 'INTERNAL' | 'TEAM'
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
      content,
    },
  }
}

export async function createProjectEvent(slug: string, locale: string, input: EventInput): Promise<CalendarActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const built = await buildData(input)
  if ('error' in built) return { error: built.error }

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
    await emitActivity({ type: 'calendar.created', userId: String(ctx.user.id), projectId: ctx.project.id, reference: { collection: 'calendar-events', id: String(event.id) } })
  } catch {
    return { error: 'Termin konnte nicht erstellt werden.' }
  }

  revalidateCalendar(locale, slug)
  return { ok: true }
}

export async function updateProjectEvent(slug: string, locale: string, eventId: string, input: EventInput): Promise<CalendarActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  const built = await buildData(input)
  if ('error' in built) return { error: built.error }

  try {
    const payload = await getPayload({ config })
    if (!(await getProjectEvent(payload, ctx.project.id, eventId))) return { error: 'Termin nicht gefunden.' }
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
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  try {
    const payload = await getPayload({ config })
    if (!(await getProjectEvent(payload, ctx.project.id, eventId))) return { error: 'Termin nicht gefunden.' }
    await payload.delete({ collection: 'calendar-events', id: eventId, overrideAccess: true })
  } catch {
    return { error: 'Termin konnte nicht gelöscht werden.' }
  }

  revalidateCalendar(locale, slug)
  return { ok: true }
}
