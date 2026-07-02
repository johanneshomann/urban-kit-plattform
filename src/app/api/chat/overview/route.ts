import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { relId, ensureProjectRoomMemberships } from '@/lib/chat/access'
import { serializeUserRef } from '@/lib/chat/serialize'
import type { ChatRoom, ChatRoomMember, Project } from '@/payload-types'

// GET /api/chat/overview — all of the caller's rooms with unread counts, for the chat popup.
// ?sync=1 (sent once when the popup opens) reconciles project-room memberships,
// so members who joined a project after its rooms were created get auto-added.
export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = String(user.id)

  if (req.nextUrl.searchParams.get('sync') === '1') {
    const activeMemberships = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: userId } }, { status: { equals: 'active' } }] },
      limit: 100, depth: 0, overrideAccess: true,
    })
    for (const m of activeMemberships.docs) {
      const projectId = relId((m as { project?: unknown }).project)
      if (projectId) await ensureProjectRoomMemberships(payload, projectId, userId).catch(() => {})
    }
  }

  const memberships = (await payload.find({
    collection: 'chat-room-members',
    where: { and: [{ user: { equals: userId } }, { status: { in: ['active', 'invited'] } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })).docs as ChatRoomMember[]

  const roomIds = memberships.map((m) => relId(m.room)).filter((v): v is string => !!v)
  if (roomIds.length === 0) return NextResponse.json({ rooms: [], totalUnread: 0 })

  const rooms = (await payload.find({
    collection: 'chat-rooms', where: { id: { in: roomIds } }, limit: 500, depth: 0, overrideAccess: true,
  })).docs as ChatRoom[]
  const roomById = new Map(rooms.map((r) => [String(r.id), r]))

  // Batch: projects for project rooms
  const projectIds = rooms.map((r) => (r.type === 'project' ? relId(r.project) : null)).filter((v): v is string => !!v)
  const projects = projectIds.length
    ? (await payload.find({ collection: 'projects', where: { id: { in: projectIds } }, limit: 500, depth: 0, overrideAccess: true })).docs as Project[]
    : []
  const projectById = new Map(projects.map((p) => [String(p.id), p]))

  // Batch: the "other" participant for DM rooms
  const dmRoomIds = rooms.filter((r) => r.type === 'dm').map((r) => String(r.id))
  const otherByRoom = new Map<string, ReturnType<typeof serializeUserRef>>()
  if (dmRoomIds.length) {
    const dmMembers = (await payload.find({
      collection: 'chat-room-members',
      where: { and: [{ room: { in: dmRoomIds } }, { user: { not_equals: userId } }] },
      limit: 1000, depth: 1, overrideAccess: true,
    })).docs as ChatRoomMember[]
    for (const m of dmMembers) otherByRoom.set(relId(m.room) ?? '', serializeUserRef(m.user))
  }

  const items = await Promise.all(memberships.map(async (m) => {
    const room = roomById.get(relId(m.room) ?? '')
    if (!room) return null
    const and: Record<string, unknown>[] = [{ room: { equals: String(room.id) } }, { author: { not_equals: userId } }]
    if (m.lastReadAt) and.push({ createdAt: { greater_than: m.lastReadAt } })
    const unread = (await payload.count({ collection: 'chat-messages', where: { and } as never, overrideAccess: true })).totalDocs
    const project = room.type === 'project' ? projectById.get(relId(room.project) ?? '') : null
    const other = room.type === 'dm' ? otherByRoom.get(String(room.id)) ?? null : null
    return {
      id: String(room.id),
      type: room.type,
      name: room.type === 'dm' ? (other?.name ?? 'Direktnachricht') : (room.name ?? 'Raum'),
      role: m.role,
      status: m.status,
      project: project ? { slug: project.slug, title: project.title } : null,
      other,
      lastMessageAt: room.lastMessageAt ?? room.updatedAt,
      lastMessagePreview: room.lastMessagePreview ?? '',
      unread: m.status === 'invited' ? 0 : unread,
    }
  }))

  const rooms_ = items.filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
  const totalUnread = rooms_.reduce((s, r) => s + r.unread, 0)
  return NextResponse.json({ rooms: rooms_, totalUnread })
}
