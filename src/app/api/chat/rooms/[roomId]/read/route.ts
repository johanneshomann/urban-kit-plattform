import { NextRequest, NextResponse } from 'next/server'
import { authRoom } from '@/lib/chat/route-auth'

// POST — mark the room read up to now for the caller.
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const a = await authRoom(req, roomId)
  if ('error' in a) return a.error
  await a.payload.update({
    collection: 'chat-room-members', id: String(a.ctx.membership.id),
    data: { lastReadAt: new Date().toISOString() }, overrideAccess: true,
  }).catch(() => {})
  return NextResponse.json({ ok: true })
}
