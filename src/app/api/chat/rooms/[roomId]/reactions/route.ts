import { NextRequest, NextResponse } from 'next/server'
import { authRoom } from '@/lib/chat/route-auth'
import { relId } from '@/lib/chat/access'
import type { ChatMessage } from '@/payload-types'

// POST { messageId, emoji } — toggle the caller's reaction on a message in this room.
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const a = await authRoom(req, roomId)
  if ('error' in a) return a.error
  const { payload, userId } = a

  const body = await req.json().catch(() => ({}))
  const messageId = typeof body.messageId === 'string' ? body.messageId : ''
  const emoji = typeof body.emoji === 'string' ? body.emoji.trim().slice(0, 8) : ''
  if (!messageId || !emoji) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const msg = await payload.findByID({ collection: 'chat-messages', id: messageId, depth: 0, overrideAccess: true }).catch(() => null) as ChatMessage | null
  if (!msg || relId(msg.room) !== roomId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const current = (msg.reactions ?? []).map((r) => ({ emoji: r.emoji, user: relId(r.user) }))
  const has = current.some((r) => r.emoji === emoji && r.user === userId)
  const next = has
    ? current.filter((r) => !(r.emoji === emoji && r.user === userId))
    : [...current, { emoji, user: userId }]

  await payload.update({
    collection: 'chat-messages', id: messageId,
    data: { reactions: next.map((r) => ({ emoji: r.emoji, user: r.user as string })) }, overrideAccess: true,
  })
  return NextResponse.json({ ok: true })
}
