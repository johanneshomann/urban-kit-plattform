import { NextRequest, NextResponse } from 'next/server'
import { authUser } from '@/lib/chat/route-auth'
import { relId } from '@/lib/chat/access'
import type { ChatRoomMember } from '@/payload-types'

// POST { userId } — find or create the 1:1 DM room between the caller and userId.
export async function POST(req: NextRequest) {
  const a = await authUser(req)
  if ('error' in a) return a.error
  const { payload, userId } = a

  const body = await req.json().catch(() => ({}))
  const targetId = typeof body.userId === 'string' ? body.userId : ''
  if (!targetId || targetId === userId) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const target = await payload.findByID({ collection: 'users', id: targetId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!target) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Existing DM: a room where both are members. Gather my DM rooms, then intersect.
  const myDmMemberRoomIds = ((await payload.find({
    collection: 'chat-room-members', where: { user: { equals: userId } }, limit: 1000, depth: 1, overrideAccess: true,
  })).docs as ChatRoomMember[])
    .filter((m) => typeof m.room === 'object' && (m.room as { type?: string }).type === 'dm')
    .map((m) => relId(m.room))
    .filter((v): v is string => !!v)

  if (myDmMemberRoomIds.length) {
    const shared = (await payload.find({
      collection: 'chat-room-members',
      where: { and: [{ room: { in: myDmMemberRoomIds } }, { user: { equals: targetId } }] },
      limit: 1, depth: 0, overrideAccess: true,
    })).docs[0] as ChatRoomMember | undefined
    if (shared) return NextResponse.json({ roomId: relId(shared.room) })
  }

  const room = await payload.create({ collection: 'chat-rooms', data: { type: 'dm', createdBy: userId }, overrideAccess: true })
  const roomId = String(room.id)
  await payload.create({ collection: 'chat-room-members', data: { room: roomId, user: userId, role: 'member', status: 'active' }, overrideAccess: true })
  await payload.create({ collection: 'chat-room-members', data: { room: roomId, user: targetId, role: 'member', status: 'active' }, overrideAccess: true })
  return NextResponse.json({ roomId })
}
