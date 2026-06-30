'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import type { Payload } from 'payload'
import { getUser } from '@/lib/auth/getUser'
import { getViewerTier, canView, type Visibility } from '@/lib/visibility'

export type AttendState = { error?: string; attending?: boolean }

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

async function projectBySlug(payload: Payload, slug: string) {
  const res = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  return res.docs[0] as { id: string } | undefined
}

/** Toggle the current member's attendance for an event ("Ich nehme teil"). */
export async function toggleEventAttendance(slug: string, locale: string, eventId: string): Promise<AttendState> {
  const user = await getUser()
  if (!user) return { error: 'Bitte melde dich an.' }

  try {
    const payload = await getPayload({ config })
    const project = await projectBySlug(payload, slug)
    if (!project) return { error: 'Projekt nicht gefunden.' }

    const tier = await getViewerTier(payload, String(user.id), project.id)
    if (tier === 'public') return { error: 'Nur Projektmitglieder können teilnehmen.' }

    const event = await payload.findByID({ collection: 'calendar-events', id: eventId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!event || relId((event as { project?: unknown }).project) !== String(project.id)) return { error: 'Termin nicht gefunden.' }
    if (!canView(tier, (event as { visibility?: Visibility }).visibility)) return { error: 'Termin nicht verfügbar.' }

    const existing = await payload.find({
      collection: 'event-attendees',
      where: { and: [{ event: { equals: eventId } }, { user: { equals: user.id } }] },
      limit: 1, depth: 0, overrideAccess: true,
    })

    let attending: boolean
    if (existing.totalDocs > 0) {
      await payload.delete({ collection: 'event-attendees', id: existing.docs[0].id, overrideAccess: true })
      attending = false
    } else {
      await payload.create({ collection: 'event-attendees', data: { event: eventId, user: user.id, project: project.id }, overrideAccess: true })
      attending = true
    }

    revalidatePath(`/${locale}/dashboard/projekte/${slug}/m/calendar`)
    return { attending }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}
