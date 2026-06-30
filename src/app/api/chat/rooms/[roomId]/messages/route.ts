import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authRoom } from '@/lib/chat/route-auth'
import { serializeMessage, personName } from '@/lib/chat/serialize'
import type { ChatMessage, ChatRoomMember } from '@/payload-types'

const TYPING_WINDOW_MS = 6000

// GET — incremental messages + typing indicator for a room.
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const a = await authRoom(req, roomId)
  if ('error' in a) return a.error
  const { payload, userId } = a

  const after = req.nextUrl.searchParams.get('after')
  const and: Record<string, unknown>[] = [{ room: { equals: roomId } }]
  if (after) and.push({ createdAt: { greater_than: after } })

  const res = await payload.find({
    collection: 'chat-messages', where: { and } as never,
    sort: 'createdAt', limit: 100, depth: 1, overrideAccess: true,
  })
  const messages = (res.docs as ChatMessage[]).map((m) => serializeMessage(m, userId))

  // Heartbeat: mark caller present
  await payload.update({ collection: 'chat-room-members', id: String(a.ctx.membership.id), data: { lastSeenAt: new Date().toISOString() }, overrideAccess: true }).catch(() => {})

  // Typing: other members whose lastTypingAt is recent
  const since = new Date(Date.now() - TYPING_WINDOW_MS).toISOString()
  const typingDocs = (await payload.find({
    collection: 'chat-room-members',
    where: { and: [{ room: { equals: roomId } }, { user: { not_equals: userId } }, { lastTypingAt: { greater_than: since } }] },
    depth: 1, limit: 20, overrideAccess: true,
  })).docs as ChatRoomMember[]
  const typing = typingDocs.map((m) => personName(m.user))

  return NextResponse.json({ messages, typing, serverTime: new Date().toISOString() })
}

// POST — send a message (text and/or image attachment).
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const a = await authRoom(req, roomId)
  if ('error' in a) return a.error
  const { payload, userId } = a

  const body = await req.json().catch(() => ({}))
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const attachmentId = typeof body.attachmentId === 'string' ? body.attachmentId : undefined
  if (!content && !attachmentId) return NextResponse.json({ error: 'empty' }, { status: 400 })

  const created = await payload.create({
    collection: 'chat-messages',
    data: { room: roomId, content, author: userId, attachment: attachmentId },
    depth: 1, overrideAccess: true,
  })

  const preview = content ? content.slice(0, 120) : '📎 Anhang'
  await payload.update({ collection: 'chat-rooms', id: roomId, data: { lastMessageAt: new Date().toISOString(), lastMessagePreview: preview }, overrideAccess: true }).catch(() => {})
  // Clear the sender's typing flag and mark read up to now
  await payload.update({ collection: 'chat-room-members', id: String(a.ctx.membership.id), data: { lastTypingAt: null, lastReadAt: new Date().toISOString() }, overrideAccess: true }).catch(() => {})

  return NextResponse.json({ message: serializeMessage(created as ChatMessage, userId) })
}
