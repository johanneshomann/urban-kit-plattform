import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cookies } from 'next/headers'
import { getViewerTier, canView, type Visibility } from '@/lib/visibility'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))

function pad(n: number) { return String(n).padStart(2, '0') }
function utc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}
function dateOnly(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
}
function esc(s: string): string {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const payload = await getPayload({ config })

  const event = await payload.findByID({ collection: 'calendar-events', id: eventId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!event) return new NextResponse('Not found', { status: 404 })

  // Visibility gate based on the requester's tier for the event's project
  const projectId = relId((event as { project?: unknown }).project)
  let tier: Awaited<ReturnType<typeof getViewerTier>> = 'public'
  if (projectId) {
    const token = (await cookies()).get('payload-token')?.value
    let userId: string | null = null
    if (token) {
      const me = await payload.auth({ headers: new Headers({ authorization: `JWT ${token}` }) }).catch(() => null)
      userId = me?.user ? String(me.user.id) : null
    }
    tier = await getViewerTier(payload, userId, projectId)
  }
  const e = event as { title?: string; startDate?: string; endDate?: string | null; allDay?: boolean; location?: string; visibility?: Visibility }
  if (!canView(tier, e.visibility)) return new NextResponse('Forbidden', { status: 403 })
  if (!e.startDate) return new NextResponse('No date', { status: 404 })

  const start = new Date(e.startDate)
  const end = e.endDate ? new Date(e.endDate) : null
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UrbanKIT//Calendar//DE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${eventId}@urbankit`,
    `DTSTAMP:${utc(new Date())}`,
    e.allDay ? `DTSTART;VALUE=DATE:${dateOnly(start)}` : `DTSTART:${utc(start)}`,
    end ? (e.allDay ? `DTEND;VALUE=DATE:${dateOnly(end)}` : `DTEND:${utc(end)}`) : '',
    `SUMMARY:${esc(e.title ?? 'Termin')}`,
    e.location ? `LOCATION:${esc(e.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return new NextResponse(lines.join('\r\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="termin-${eventId}.ics"`,
    },
  })
}
