import { getPayload } from 'payload'
import config from '@payload-config'
import { lexicalToHtml } from '@/lib/richtext'
import { visibilityWhere, type ViewerTier } from '@/lib/visibility'
import { CalendarConsumption, type ConsumptionEvent } from './CalendarConsumption'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

/** Loads visible events + attendance for a project and renders the citizen calendar. */
export async function CalendarFeed({ slug, locale, projectId, tier, userId }: { slug: string; locale: string; projectId: string; tier: ViewerTier; userId: string | null }) {
  const payload = await getPayload({ config })

  const eventsRes = await payload.find({
    collection: 'calendar-events',
    where: { and: [{ project: { equals: projectId } }, visibilityWhere(tier)] },
    sort: 'startDate',
    limit: 300,
    depth: 0,
    overrideAccess: true,
  })
  const eventIds = eventsRes.docs.map((e) => (e as { id: string | number }).id)

  const attendeesRes = eventIds.length
    ? await payload.find({ collection: 'event-attendees', where: { event: { in: eventIds } }, limit: 100000, depth: 0, overrideAccess: true })
    : { docs: [] as unknown[] }

  const countByEvent = new Map<string, number>()
  const mine = new Set<string>()
  for (const a of attendeesRes.docs) {
    const ev = relId((a as { event?: unknown }).event)
    if (!ev) continue
    countByEvent.set(ev, (countByEvent.get(ev) ?? 0) + 1)
    if (userId && relId((a as { user?: unknown }).user) === userId) mine.add(ev)
  }

  const events: ConsumptionEvent[] = eventsRes.docs.map((doc) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = doc as any
    const id = String(e.id)
    return {
      id,
      title: e.title ?? '',
      startDate: e.startDate,
      endDate: e.endDate ?? null,
      allDay: e.allDay ?? false,
      location: e.location ?? null,
      category: e.category ?? null,
      bodyHtml: lexicalToHtml(e.content),
      attendeeCount: countByEvent.get(id) ?? 0,
      attending: mine.has(id),
    }
  })

  return <CalendarConsumption slug={slug} locale={locale} events={events} canAttend={tier !== 'public'} />
}
