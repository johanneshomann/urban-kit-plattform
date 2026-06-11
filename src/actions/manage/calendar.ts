'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { createCalendarEvent } from '@/modules/calendar/actions'
import { uniqueSlug } from '@/lib/slugify'

export type CalendarActionState = { error?: string; ok?: boolean }

function revalidateCalendar(locale: string, slug: string) {
  revalidatePath(`/${locale}/dashboard/projekte/${slug}/manage/inhalte/calendar`)
  revalidatePath(`/${locale}/dashboard/projekte/${slug}`)
}

export async function createProjectEvent(
  slug: string,
  locale: string,
  input: {
    title: string
    startDate: string
    endDate?: string
    location?: string
    category?: string
    visibility?: string
  },
): Promise<CalendarActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

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

  try {
    await createCalendarEvent(ctx.user, {
      title,
      slug: uniqueSlug(title, 'termin'),
      startDate: start.toISOString(),
      endDate: end?.toISOString(),
      location: input.location?.trim() || undefined,
      category: input.category?.trim() || undefined,
      visibility: input.visibility,
      projectId: ctx.project.id,
    })
  } catch {
    return { error: 'Termin konnte nicht erstellt werden.' }
  }

  revalidateCalendar(locale, slug)
  return { ok: true }
}

export async function deleteProjectEvent(
  slug: string,
  locale: string,
  eventId: string,
): Promise<CalendarActionState> {
  const ctx = await getProjectManagerContext(slug)
  if (!ctx) return { error: 'Nicht berechtigt.' }

  // The collection's delete access is only `isAuthenticated` — enforce that the
  // event actually belongs to this project before deleting.
  const payload = await getPayload({ config })
  const event = await payload
    .findByID({ collection: 'calendar-events', id: eventId, depth: 0, overrideAccess: true })
    .catch(() => null)
  const projectId = event && typeof event.project === 'object' ? event.project?.id : event?.project
  if (!event || String(projectId) !== String(ctx.project.id)) {
    return { error: 'Termin nicht gefunden.' }
  }

  try {
    await payload.delete({ collection: 'calendar-events', id: eventId, overrideAccess: true })
  } catch {
    return { error: 'Termin konnte nicht gelöscht werden.' }
  }

  revalidateCalendar(locale, slug)
  return { ok: true }
}
