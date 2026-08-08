import 'server-only'
import type { Payload, Where } from 'payload'
import type { ChatRoom, ChatRoomMember } from '@/payload-types'
import { isProjectManager } from '@/lib/access/project'

/** Normalise a Payload relationship value (id | doc) to its string id. */
export const relId = (v: unknown): string | null =>
  v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v)

/** The current user's membership in a room, or null. Optionally require status. */
export async function getRoomMembership(
  payload: Payload,
  userId: string,
  roomId: string,
  status: 'active' | 'invited' | 'left' | 'any' = 'active',
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

/** True when the project has the chat module enabled (hard module gate). */
export async function projectChatEnabled(payload: Payload, projectId: string): Promise<boolean> {
  const project = await payload
    .findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true })
    .catch(() => null)
  const modules = (project as { modules?: string[] | null } | null)?.modules
  return Array.isArray(modules) && modules.includes('chat')
}

/**
 * Guard: returns the room + the caller's active membership, or null if not a
 * member. Project rooms additionally require the project's chat module to be
 * enabled — disabling the module cuts off messages/read/typing/reactions for
 * members AND PMs in one place (every room route goes through here).
 */
export async function requireRoomMember(payload: Payload, userId: string, roomId: string): Promise<RoomContext | null> {
  const membership = await getRoomMembership(payload, userId, roomId, 'active')
  if (!membership) return null
  const room = await payload.findByID({ collection: 'chat-rooms', id: roomId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!room) return null
  if ((room as ChatRoom).type === 'project') {
    const projectId = relId((room as ChatRoom).project)
    if (!projectId || !(await projectChatEnabled(payload, projectId))) return null
  }
  return { room: room as ChatRoom, membership }
}

/** Guard: like requireRoomMember but the caller must be the room owner. */
export async function requireRoomOwner(payload: Payload, userId: string, roomId: string): Promise<RoomContext | null> {
  const ctx = await requireRoomMember(payload, userId, roomId)
  if (!ctx || ctx.membership.role !== 'owner') return null
  return ctx
}

export interface RoomManagerContext {
  room: ChatRoom
  /** May be null — a project PM can manage rooms they are not (or no longer) in. */
  membership: ChatRoomMember | null
}

/**
 * Guard for room administration (rename/delete): the room owner, an active PM
 * of the room's project (project rooms), or a platform admin. Deliberately
 * does NOT require room membership — PMs manage all of their project's rooms.
 */
export async function requireRoomManager(
  payload: Payload,
  userId: string,
  roomId: string,
  opts: { isAdmin?: boolean } = {},
): Promise<RoomManagerContext | null> {
  const room = (await payload
    .findByID({ collection: 'chat-rooms', id: roomId, depth: 0, overrideAccess: true })
    .catch(() => null)) as ChatRoom | null
  if (!room) return null
  const membership = await getRoomMembership(payload, userId, roomId, 'any')
  if (opts.isAdmin) return { room, membership }
  if (membership?.status === 'active' && membership.role === 'owner') return { room, membership }
  if (room.type === 'project') {
    const projectId = relId(room.project)
    if (projectId && (await isProjectManager(payload, userId, projectId))) return { room, membership }
  }
  return null
}

/**
 * Ensure an active project member is a member of every project room. Called when
 * a member opens the project chat, so people who joined after a room was created
 * still see it. Safe to call repeatedly (idempotent per room). Rows with status
 * 'left' are deliberately NOT resurrected — leaving a room is durable. Skips
 * projects whose chat module is disabled.
 */
export async function ensureProjectRoomMemberships(payload: Payload, projectId: string, userId: string): Promise<void> {
  if (!(await projectChatEnabled(payload, projectId))) return
  const rooms = await payload.find({
    collection: 'chat-rooms',
    where: { and: [{ type: { equals: 'project' } }, { project: { equals: projectId } }] },
    limit: 200, depth: 0, overrideAccess: true,
  })
  for (const room of rooms.docs as ChatRoom[]) {
    const existing = await getRoomMembership(payload, userId, String(room.id), 'any')
    if (!existing) {
      await payload.create({ collection: 'chat-room-members', data: { room: String(room.id), user: userId, role: 'member', status: 'active' }, overrideAccess: true })
    }
  }
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
