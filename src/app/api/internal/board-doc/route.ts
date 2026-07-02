import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

// ADR-2 (Mongo addendum): the Hocuspocus Database extension persists board Yjs
// state here (base64 on board-canvases.yjsState). Server-to-server only.
const canvasIdFrom = (room: string | null): string | null => {
  if (!room) return null
  const [moduleType, , resourceId] = room.split(':')
  return moduleType === 'board' && resourceId ? resourceId : null
}

function checkSecret(req: NextRequest) {
  return req.headers.get('x-hocuspocus-secret') === process.env.HOCUSPOCUS_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const canvasId = canvasIdFrom(req.nextUrl.searchParams.get('room'))
  if (!canvasId) return NextResponse.json({ error: 'bad room' }, { status: 400 })

  const payload = await getPayload({ config })
  const canvas = await payload.findByID({ collection: 'board-canvases', id: canvasId, depth: 0, overrideAccess: true }).catch(() => null)
  return NextResponse.json({ state: (canvas as { yjsState?: string | null } | null)?.yjsState ?? null })
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { room?: string; state?: string }
  const canvasId = canvasIdFrom(body.room ?? null)
  if (!canvasId || typeof body.state !== 'string') return NextResponse.json({ error: 'bad request' }, { status: 400 })

  const payload = await getPayload({ config })
  await payload.update({ collection: 'board-canvases', id: canvasId, data: { yjsState: body.state }, overrideAccess: true }).catch(() => {})
  return NextResponse.json({ ok: true })
}
