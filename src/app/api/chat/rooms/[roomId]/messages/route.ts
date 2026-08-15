// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { authRoom } from '@/lib/chat/route-auth'
import { relId } from '@/lib/chat/access'
import { resolveMention, type Mentionable } from '@/lib/chat/mentionables'
import { serializeMessage, personName } from '@/lib/chat/serialize'
import type { ChatMessage, ChatRoomMember } from '@/payload-types'

const TYPING_WINDOW_MS = 6000

// GET — incremental messages + typing indicator for a room.
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const a = await authRoom(req, roomId)
  if ('error' in a) return a.error
  const { payload, userId } = a

  // Windowing: `after` = incremental poll (ascending). Without it, the NEWEST
  // 50 are returned (fetched descending, reversed) — a busy room must open on
  // the present, not on ancient history. `before` pages backwards for
  // scroll-back; client detects "more" via a full page.
  const after = req.nextUrl.searchParams.get('after')
  const before = req.nextUrl.searchParams.get('before')
  const and: Record<string, unknown>[] = [{ room: { equals: roomId } }]
  if (after) and.push({ createdAt: { greater_than: after } })
  else if (before) and.push({ createdAt: { less_than: before } })

  const res = await payload.find({
    collection: 'chat-messages', where: { and } as never,
    sort: after ? 'createdAt' : '-createdAt', limit: after ? 100 : 50, depth: 1, overrideAccess: true,
  })
  const docs = after ? (res.docs as ChatMessage[]) : (res.docs as ChatMessage[]).reverse()
  const messages = docs.map((m) => serializeMessage(m, userId))

  // Heartbeat: mark caller present
  await payload.update({ collection: 'chat-room-members', id: String(a.ctx.membership.id), data: { lastSeenAt: new Date().toISOString() }, overrideAccess: true }).catch(() => {})

  // Typing: other members whose lastTypingAt is recent
  const since = new Date(Date.now() - TYPING_WINDOW_MS).toISOString()
  const typingDocs = (await payload.find({
    collection: 'chat-room-members',
    where: { and: [{ room: { equals: roomId } }, { user: { not_equals: userId } }, { lastTypingAt: { greater_than: since } }] },
    depth: 1, limit: 20, overrideAccess: true,
  })).docs as ChatRoomMember[]
  const typing = typingDocs.map((m) => personName(m.user)).filter((n): n is string => !!n)

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

  // Content mentions: re-validated server-side — each must belong to the
  // room's project and be visible to the sender; snapshots stored (cap 5).
  let mentions: Mentionable[] = []
  const roomProjectId = relId(a.ctx.room.project)
  if (roomProjectId && Array.isArray(body.mentions)) {
    const requested = (body.mentions as { module?: unknown; id?: unknown }[])
      .filter((m) => typeof m.module === 'string' && typeof m.id === 'string')
      .slice(0, 5)
    const resolved = await Promise.all(
      requested.map((m) => resolveMention(payload, userId, roomProjectId, m.module as string, m.id as string)),
    )
    mentions = resolved.filter((m): m is Mentionable => m !== null)
  }

  const created = await payload.create({
    collection: 'chat-messages',
    data: { room: roomId, content, author: userId, attachment: attachmentId, mentions },
    depth: 1, overrideAccess: true,
  })

  // Language-neutral preview — the JSON API must not carry German strings.
  const preview = content ? content.slice(0, 120) : '📎'
  await payload.update({ collection: 'chat-rooms', id: roomId, data: { lastMessageAt: new Date().toISOString(), lastMessagePreview: preview }, overrideAccess: true }).catch(() => {})
  // Clear the sender's typing flag and mark read up to now
  await payload.update({ collection: 'chat-room-members', id: String(a.ctx.membership.id), data: { lastTypingAt: null, lastReadAt: new Date().toISOString() }, overrideAccess: true }).catch(() => {})

  return NextResponse.json({ message: serializeMessage(created as ChatMessage, userId) })
}
