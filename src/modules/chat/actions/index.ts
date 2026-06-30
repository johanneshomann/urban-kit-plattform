'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { isPMOfAnyProject, requireRoomOwner, getRoomMembership, relId } from '@/lib/chat/access'

export type ChatActionState = { error?: string; ok?: boolean; roomId?: string }

function revalidateChat() {
  revalidatePath('/', 'layout')
}

/** Ensure a membership row exists (idempotent). */
async function addMember(
  payload: Payload,
  roomId: string,
  userId: string,
  opts: { role?: 'owner' | 'member'; status?: 'active' | 'invited'; invitedBy?: string } = {},
) {
  const existing = await getRoomMembership(payload, userId, roomId, 'any')
  if (existing) return
  await payload.create({
    collection: 'chat-room-members',
    data: { room: roomId, user: userId, role: opts.role ?? 'member', status: opts.status ?? 'active', invitedBy: opts.invitedBy },
    overrideAccess: true,
  })
}

/** Active project members' user ids. */
async function activeProjectMemberIds(payload: Payload, projectId: string): Promise<string[]> {
  const res = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ project: { equals: projectId } }, { status: { equals: 'active' } }] },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  return res.docs.map((m) => relId((m as { user?: unknown }).user)).filter((v): v is string => !!v)
}

/** PM creates a project room; all active project members are auto-joined. */
export async function createProjectRoom(slug: string, name: string): Promise<ChatActionState> {
  const pm = await getProjectManagerContext(slug)
  if (!pm) return { error: 'Nur Projektmanager:innen können Räume erstellen.' }
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name darf nicht leer sein.' }

  try {
    const payload = await getPayload({ config })
    const room = await payload.create({
      collection: 'chat-rooms',
      data: { type: 'project', name: trimmed, project: pm.project.id, createdBy: pm.user.id },
      overrideAccess: true,
    })
    const roomId = String(room.id)
    const creatorId = String(pm.user.id)
    await addMember(payload, roomId, creatorId, { role: 'owner' })
    for (const uid of await activeProjectMemberIds(payload, pm.project.id)) {
      if (uid !== creatorId) await addMember(payload, roomId, uid, { role: 'member' })
    }
    revalidateChat()
    return { ok: true, roomId }
  } catch {
    return { error: 'Raum konnte nicht erstellt werden.' }
  }
}

/** PM (of any project) creates a standalone, invite-only group. */
export async function createGroup(name: string, memberIds: string[]): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name darf nicht leer sein.' }

  try {
    const payload = await getPayload({ config })
    if (!(await isPMOfAnyProject(payload, String(user.id)))) {
      return { error: 'Nur Projektmanager:innen können Gruppen erstellen.' }
    }
    const room = await payload.create({
      collection: 'chat-rooms',
      data: { type: 'group', name: trimmed, createdBy: user.id },
      overrideAccess: true,
    })
    const roomId = String(room.id)
    await addMember(payload, roomId, String(user.id), { role: 'owner' })
    for (const uid of [...new Set(memberIds.filter(Boolean))]) {
      if (uid !== String(user.id)) await addMember(payload, roomId, uid, { role: 'member', status: 'invited', invitedBy: String(user.id) })
    }
    revalidateChat()
    return { ok: true, roomId }
  } catch {
    return { error: 'Gruppe konnte nicht erstellt werden.' }
  }
}

/** Owner invites more users to a group. */
export async function inviteToGroup(roomId: string, userIds: string[]): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const ctx = await requireRoomOwner(payload, String(user.id), roomId)
    if (!ctx || ctx.room.type !== 'group') return { error: 'Keine Berechtigung.' }
    for (const uid of [...new Set(userIds.filter(Boolean))]) {
      await addMember(payload, roomId, uid, { role: 'member', status: 'invited', invitedBy: String(user.id) })
    }
    revalidateChat()
    return { ok: true }
  } catch {
    return { error: 'Einladung fehlgeschlagen.' }
  }
}

/** Accept a pending group invite. */
export async function acceptInvite(roomId: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const m = await getRoomMembership(payload, String(user.id), roomId, 'invited')
    if (!m) return { error: 'Keine Einladung gefunden.' }
    await payload.update({ collection: 'chat-room-members', id: String(m.id), data: { status: 'active' }, overrideAccess: true })
    revalidateChat()
    return { ok: true, roomId }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/** Owner removes a member; the room owner cannot be removed. */
export async function removeMember(roomId: string, userId: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const ctx = await requireRoomOwner(payload, String(user.id), roomId)
    if (!ctx) return { error: 'Keine Berechtigung.' }
    const target = await getRoomMembership(payload, userId, roomId, 'any')
    if (!target || target.role === 'owner') return { error: 'Mitglied kann nicht entfernt werden.' }
    await payload.delete({ collection: 'chat-room-members', id: String(target.id), overrideAccess: true })
    revalidateChat()
    return { ok: true }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/** Leave a room (groups/DMs). Owners must transfer or delete instead. */
export async function leaveRoom(roomId: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const m = await getRoomMembership(payload, String(user.id), roomId, 'any')
    if (!m) return { error: 'Nicht Mitglied.' }
    if (m.role === 'owner') return { error: 'Owner können den Raum nicht verlassen, nur löschen.' }
    await payload.delete({ collection: 'chat-room-members', id: String(m.id), overrideAccess: true })
    revalidateChat()
    return { ok: true }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/** Owner renames a room. */
export async function renameRoom(roomId: string, name: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name darf nicht leer sein.' }
  try {
    const payload = await getPayload({ config })
    const ctx = await requireRoomOwner(payload, String(user.id), roomId)
    if (!ctx) return { error: 'Keine Berechtigung.' }
    await payload.update({ collection: 'chat-rooms', id: roomId, data: { name: trimmed }, overrideAccess: true })
    revalidateChat()
    return { ok: true }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/** Owner deletes a room and its messages + memberships. */
export async function deleteRoom(roomId: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const ctx = await requireRoomOwner(payload, String(user.id), roomId)
    if (!ctx) return { error: 'Keine Berechtigung.' }
    await payload.delete({ collection: 'chat-messages', where: { room: { equals: roomId } }, overrideAccess: true })
    await payload.delete({ collection: 'chat-room-members', where: { room: { equals: roomId } }, overrideAccess: true })
    await payload.delete({ collection: 'chat-rooms', id: roomId, overrideAccess: true })
    revalidateChat()
    return { ok: true }
  } catch {
    return { error: 'Raum konnte nicht gelöscht werden.' }
  }
}

/** Re-sync a project room's members against current active project members. */
export async function reconcileProjectRoomMembers(roomId: string): Promise<void> {
  const payload = await getPayload({ config })
  const room = await payload.findByID({ collection: 'chat-rooms', id: roomId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!room || room.type !== 'project') return
  const projectId = relId(room.project)
  if (!projectId) return
  for (const uid of await activeProjectMemberIds(payload, projectId)) {
    await addMember(payload, roomId, uid, { role: relId(room.createdBy) === uid ? 'owner' : 'member' })
  }
}
