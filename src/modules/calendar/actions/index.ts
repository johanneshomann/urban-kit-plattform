'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { payloadAs } from '@/lib/payload-client'
import { emitActivity } from '@/lib/events'
import type { User } from '@/payload-types'

export async function createCalendarEvent(user: User, data: {
  title: string
  slug: string
  startDate: string
  endDate?: string
  location?: string
  category?: string
  projectId: string
  moduleId: string
  visibility?: string
}) {
  const payload = await getPayload({ config })
  const event = await payload.create({
    collection: 'calendar-events',
    data: {
      title: data.title,
      slug: data.slug,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location,
      category: data.category,
      visibility: (data.visibility ?? 'INTERNAL') as 'PUBLIC' | 'INTERNAL' | 'TEAM',
      author: user.id,
      projectModule: { project: data.projectId, module: data.moduleId },
    },
    ...payloadAs(user),
  })
  await emitActivity({ type: 'calendar.created', userId: String(user.id), projectId: data.projectId, reference: { collection: 'calendar-events', id: String(event.id) } })
  return event
}

export async function updateCalendarEvent(user: User, eventId: string, data: Partial<{
  title: string; startDate: string; endDate: string; location: string; category: string
}>) {
  const payload = await getPayload({ config })
  const event = await payload.update({
    collection: 'calendar-events',
    id: eventId,
    data,
    ...payloadAs(user),
  })
  await emitActivity({ type: 'calendar.updated', userId: String(user.id), reference: { collection: 'calendar-events', id: eventId } })
  return event
}
