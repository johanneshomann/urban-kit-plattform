// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { relId, ensureProjectRoomMemberships, isPMOfAnyProject } from '@/lib/chat/access'
import { serializeUserRef, personName, type UserRef } from '@/lib/chat/serialize'
import { resolveColorScheme } from '@/lib/colorScheme'
import { getColorSchemes } from '@/lib/color-schemes-store'
import type { ChatRoom, ChatRoomMember, Project } from '@/payload-types'

// GET /api/chat/overview — all of the caller's rooms with unread counts, for the chat popup.
// ?sync=1 (sent once when the popup opens) reconciles project-room memberships,
// so members who joined a project after its rooms were created get auto-added.
export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = String(user.id)

  // The viewer's own projects — powers the grouped list headers (incl. empty
  // ones so a PM can create a project's FIRST room from the popup), the
  // DM shared-project pills, the assignment picker, and the ?sync pass.
  const viewerMemberships = (await payload.find({
    collection: 'project-memberships',
    where: { and: [{ user: { equals: userId } }, { status: { equals: 'active' } }] },
    limit: 100, depth: 0, overrideAccess: true,
  })).docs
  const viewerProjectIds = viewerMemberships.map((m) => relId((m as { project?: unknown }).project)).filter((v): v is string => !!v)

  if (req.nextUrl.searchParams.get('sync') === '1') {
    for (const projectId of viewerProjectIds) {
      await ensureProjectRoomMemberships(payload, projectId, userId).catch(() => {})
    }
  }

  const memberships = (await payload.find({
    collection: 'chat-room-members',
    where: { and: [{ user: { equals: userId } }, { status: { in: ['active', 'invited'] } }] },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })).docs as ChatRoomMember[]

  // Gates the "Neue Gruppe" button client-side (createGroup re-checks anyway).
  const canCreateGroups = await isPMOfAnyProject(payload, userId)

  const pmProjectIds = new Set(
    viewerMemberships
      .filter((m) => (m as { role?: string }).role === 'PM')
      .map((m) => relId((m as { project?: unknown }).project))
      .filter((v): v is string => !!v),
  )
  const myProjectDocs = viewerProjectIds.length
    ? ((await payload.find({ collection: 'projects', where: { id: { in: viewerProjectIds } }, limit: 100, depth: 0, overrideAccess: true })).docs as Project[])
    : []
  const colorSchemes = await getColorSchemes()
  const myProjects = myProjectDocs.map((p) => {
    const scheme = resolveColorScheme(p.colorScheme, colorSchemes)
    return {
      id: String(p.id),
      slug: p.slug,
      title: p.title,
      light: scheme.light,
      accent: scheme.accent,
      isPM: pmProjectIds.has(String(p.id)),
      groupAssignmentEnabled: p.chatGroupAssignmentEnabled !== false,
    }
  })

  const roomIds = memberships.map((m) => relId(m.room)).filter((v): v is string => !!v)
  if (roomIds.length === 0) return NextResponse.json({ rooms: [], totalUnread: 0, canCreateGroups, myProjects })

  const rooms = (await payload.find({
    collection: 'chat-rooms', where: { id: { in: roomIds } }, limit: 500, depth: 0, overrideAccess: true,
  })).docs as ChatRoom[]
  const roomById = new Map(rooms.map((r) => [String(r.id), r]))

  // Batch: projects referenced by ANY room (project rooms + project-assigned groups)
  const projectIds = rooms.map((r) => relId(r.project)).filter((v): v is string => !!v)
  const projects = projectIds.length
    ? (await payload.find({ collection: 'projects', where: { id: { in: projectIds } }, limit: 500, depth: 0, overrideAccess: true })).docs as Project[]
    : []
  const projectById = new Map(projects.map((p) => [String(p.id), p]))
  /** Compact project chip payload — title + the two colors the UI needs. */
  const projectChip = (p: Project | undefined) => {
    if (!p) return null
    const scheme = resolveColorScheme(p.colorScheme, colorSchemes)
    return { slug: p.slug, title: p.title, light: scheme.light, accent: scheme.accent }
  }

  // Batch: the "other" participant for DM rooms
  const dmRoomIds = rooms.filter((r) => r.type === 'dm').map((r) => String(r.id))
  const otherByRoom = new Map<string, UserRef & { sharedProjects?: { id: string; title: string; light: string; accent: string }[] }>()
  if (dmRoomIds.length) {
    const dmMembers = (await payload.find({
      collection: 'chat-room-members',
      where: { and: [{ room: { in: dmRoomIds } }, { user: { not_equals: userId } }] },
      limit: 1000, depth: 1, overrideAccess: true,
    })).docs as ChatRoomMember[]
    for (const m of dmMembers) otherByRoom.set(relId(m.room) ?? '', serializeUserRef(m.user))

    // Shared projects with each DM partner — one batched query over the
    // viewer's own projects (already fetched above).
    const partnerIds = [...otherByRoom.values()].map((u) => u.id).filter(Boolean)
    if (viewerProjectIds.length && partnerIds.length) {
      const sharedProjectById = new Map(myProjectDocs.map((p) => [String(p.id), p]))
      const partnerMemberships = (await payload.find({
        collection: 'project-memberships',
        where: { and: [{ user: { in: partnerIds } }, { project: { in: viewerProjectIds } }, { status: { equals: 'active' } }] },
        limit: 1000, depth: 0, overrideAccess: true,
      })).docs
      const sharedByUser = new Map<string, { id: string; title: string; light: string; accent: string }[]>()
      for (const m of partnerMemberships) {
        const uid = relId((m as { user?: unknown }).user)
        const pid = relId((m as { project?: unknown }).project)
        const p = pid ? sharedProjectById.get(pid) : undefined
        if (!uid || !p) continue
        const scheme = resolveColorScheme(p.colorScheme, colorSchemes)
        const list = sharedByUser.get(uid) ?? []
        list.push({ id: String(p.id), title: p.title, light: scheme.light, accent: scheme.accent })
        sharedByUser.set(uid, list)
      }
      for (const [roomId_, other] of otherByRoom) {
        otherByRoom.set(roomId_, { ...other, sharedProjects: sharedByUser.get(other.id) ?? [] })
      }
    }
  }

  // Batch: member counts + owner names for group rooms (one query each)
  const groupRoomIds = rooms.filter((r) => r.type === 'group').map((r) => String(r.id))
  const memberCountByRoom = new Map<string, number>()
  const ownerNameByRoom = new Map<string, string | null>()
  if (groupRoomIds.length) {
    const groupMembers = (await payload.find({
      collection: 'chat-room-members',
      where: { and: [{ room: { in: groupRoomIds } }, { status: { equals: 'active' } }] },
      limit: 2000, depth: 0, overrideAccess: true,
    })).docs as ChatRoomMember[]
    for (const m of groupMembers) {
      const rid = relId(m.room) ?? ''
      memberCountByRoom.set(rid, (memberCountByRoom.get(rid) ?? 0) + 1)
    }
    const ownerIds = rooms
      .filter((r) => r.type === 'group')
      .map((r) => relId(r.createdBy))
      .filter((v): v is string => !!v)
    if (ownerIds.length) {
      const owners = (await payload.find({
        collection: 'users', where: { id: { in: ownerIds } }, limit: 200, depth: 0, overrideAccess: true,
      })).docs
      const ownerById = new Map(owners.map((u) => [String(u.id), personName(u)]))
      for (const r of rooms) {
        if (r.type !== 'group') continue
        const oid = relId(r.createdBy)
        ownerNameByRoom.set(String(r.id), oid ? (ownerById.get(oid) ?? null) : null)
      }
    }
  }

  const items = await Promise.all(memberships.map(async (m) => {
    const room = roomById.get(relId(m.room) ?? '')
    if (!room) return null
    const and: Record<string, unknown>[] = [{ room: { equals: String(room.id) } }, { author: { not_equals: userId } }]
    if (m.lastReadAt) and.push({ createdAt: { greater_than: m.lastReadAt } })
    const unread = (await payload.count({ collection: 'chat-messages', where: { and } as never, overrideAccess: true })).totalDocs
    const project = projectById.get(relId(room.project) ?? '')
    const other = room.type === 'dm' ? otherByRoom.get(String(room.id)) ?? null : null
    return {
      id: String(room.id),
      type: room.type,
      // Null names — the client renders the localized fallback.
      name: room.type === 'dm' ? (other?.name ?? null) : (room.name ?? null),
      role: m.role,
      status: m.status,
      project: projectChip(project),
      other,
      memberCount: room.type === 'group' ? (memberCountByRoom.get(String(room.id)) ?? 0) : null,
      owner: room.type === 'group' ? (ownerNameByRoom.get(String(room.id)) ?? null) : null,
      lastMessageAt: room.lastMessageAt ?? room.updatedAt,
      lastMessagePreview: room.lastMessagePreview ?? '',
      unread: m.status === 'invited' ? 0 : unread,
    }
  }))

  const rooms_ = items.filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
  const totalUnread = rooms_.reduce((s, r) => s + r.unread, 0)
  return NextResponse.json({ rooms: rooms_, totalUnread, canCreateGroups, myProjects })
}
