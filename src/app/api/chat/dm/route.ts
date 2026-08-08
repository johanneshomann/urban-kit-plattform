import { NextRequest, NextResponse } from 'next/server'
import { authUser } from '@/lib/chat/route-auth'
import { relId, getRoomMembership } from '@/lib/chat/access'
import { canDirectMessage } from '@/lib/chat/reachability'
import type { ChatRoomMember } from '@/payload-types'

// POST { userId } — find or create the 1:1 DM room between the caller and userId.
export async function POST(req: NextRequest) {
  const a = await authUser(req)
  if ('error' in a) return a.error
  const { payload, userId } = a

  const body = await req.json().catch(() => ({}))
  const targetId = typeof body.userId === 'string' ? body.userId : ''
  if (!targetId || targetId === userId) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  // Reachability shares one policy with the picker — no DMs by guessed id.
  if (!(await canDirectMessage(payload, userId, targetId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

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
    if (shared) {
      const sharedRoomId = relId(shared.room)
      // Re-opening a DM one previously left reactivates the CALLER's row only —
      // the other side's 'left' (their deliberate exit) stays untouched.
      if (sharedRoomId) {
        const myRow = await getRoomMembership(payload, userId, sharedRoomId, 'any')
        if (myRow?.status === 'left') {
          await payload.update({ collection: 'chat-room-members', id: String(myRow.id), data: { status: 'active' }, overrideAccess: true })
        }
      }
      return NextResponse.json({ roomId: sharedRoomId })
    }
  }

  const room = await payload.create({ collection: 'chat-rooms', data: { type: 'dm', createdBy: userId }, overrideAccess: true })
  const roomId = String(room.id)
  await payload.create({ collection: 'chat-room-members', data: { room: roomId, user: userId, role: 'member', status: 'active' }, overrideAccess: true })
  await payload.create({ collection: 'chat-room-members', data: { room: roomId, user: targetId, role: 'member', status: 'active' }, overrideAccess: true })
  return NextResponse.json({ roomId })
}
