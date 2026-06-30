import 'server-only'
import type { Payload, Where } from 'payload'
import type { ChatRoom, ChatRoomMember } from '@/payload-types'

/** Normalise a Payload relationship value (id | doc) to its string id. */
export const relId = (v: unknown): string | null =>
  v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v)

/** The current user's membership in a room, or null. Optionally require status. */
export async function getRoomMembership(
  payload: Payload,
  userId: string,
  roomId: string,
  status: 'active' | 'invited' | 'any' = 'active',
): Promise<ChatRoomMember | null> {
  const and: Where[] = [{ room: { equals: roomId } }, { user: { equals: userId } }]
  if (status !== 'any') and.push({ status: { equals: status } })
  const res = await payload.find({ collection: 'chat-room-members', where: { and }, limit: 1, depth: 0, overrideAccess: true })
  return (res.docs[0] as ChatRoomMember | undefined) ?? null
}

export interface RoomContext {
  room: ChatRoom
  membership: ChatRoomMember
}

/** Guard: returns the room + the caller's active membership, or null if not a member. */
export async function requireRoomMember(payload: Payload, userId: string, roomId: string): Promise<RoomContext | null> {
  const membership = await getRoomMembership(payload, userId, roomId, 'active')
  if (!membership) return null
  const room = await payload.findByID({ collection: 'chat-rooms', id: roomId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!room) return null
  return { room: room as ChatRoom, membership }
}

/** Guard: like requireRoomMember but the caller must be the room owner. */
export async function requireRoomOwner(payload: Payload, userId: string, roomId: string): Promise<RoomContext | null> {
  const ctx = await requireRoomMember(payload, userId, roomId)
  if (!ctx || ctx.membership.role !== 'owner') return null
  return ctx
}

/** True if the user is an active PM of at least one project (gates group creation). */
export async function isPMOfAnyProject(payload: Payload, userId: string): Promise<boolean> {
  const res = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: userId } }, { role: { equals: 'PM' } }, { status: { equals: 'active' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return res.totalDocs > 0
}
