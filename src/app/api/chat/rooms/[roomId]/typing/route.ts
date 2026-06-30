import { NextRequest, NextResponse } from 'next/server'
import { authRoom } from '@/lib/chat/route-auth'

// POST — typing heartbeat (client throttles to ~3s while composing). Doubles as presence.
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const a = await authRoom(req, roomId)
  if ('error' in a) return a.error
  const now = new Date().toISOString()
  await a.payload.update({
    collection: 'chat-room-members', id: String(a.ctx.membership.id),
    data: { lastTypingAt: now, lastSeenAt: now }, overrideAccess: true,
  }).catch(() => {})
  return NextResponse.json({ ok: true })
}
