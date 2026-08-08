'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/getUser'
import { getProjectManagerContext } from '@/lib/auth/requireProjectManager'
import { isPMOfAnyProject, requireRoomOwner, requireRoomManager, getRoomMembership, projectChatEnabled, relId } from '@/lib/chat/access'
import { isProjectManager } from '@/lib/access/project'

export type ChatActionState = { error?: string; ok?: boolean; roomId?: string }

function revalidateChat() {
  // Scoped to the workspace subtree — never bust the whole app cache.
  revalidatePath('/[locale]/dashboard/projekte/[slug]', 'layout')
}

/**
 * Ensure a membership row exists (idempotent). Rows with status 'left' are
 * only revived when `resurrectLeft` is set (explicit invites) — auto-joins
 * (project-room sync, reconcile) must never undo a deliberate leave.
 */
async function addMember(
  payload: Payload,
  roomId: string,
  userId: string,
  opts: { role?: 'owner' | 'member'; status?: 'active' | 'invited'; invitedBy?: string; resurrectLeft?: boolean } = {},
) {
  const existing = await getRoomMembership(payload, userId, roomId, 'any')
  if (existing) {
    if (opts.resurrectLeft && existing.status === 'left') {
      await payload.update({
        collection: 'chat-room-members',
        id: String(existing.id),
        data: { status: opts.status ?? 'active', role: opts.role ?? existing.role, invitedBy: opts.invitedBy },
        overrideAccess: true,
      })
    }
    return
  }
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
    if (!(await projectChatEnabled(payload, String(pm.project.id)))) {
      return { error: 'Das Chat-Modul ist für dieses Projekt nicht aktiviert.' }
    }
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
      // A fresh invite may revive a 'left' row — that's the sanctioned way back.
      await addMember(payload, roomId, uid, { role: 'member', status: 'invited', invitedBy: String(user.id), resurrectLeft: true })
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

/** Owner removes a member (flips to 'left' so auto-joins can't re-add them). */
export async function removeMember(roomId: string, userId: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const ctx = await requireRoomOwner(payload, String(user.id), roomId)
    if (!ctx) return { error: 'Keine Berechtigung.' }
    const target = await getRoomMembership(payload, userId, roomId, 'any')
    if (!target || target.role === 'owner') return { error: 'Mitglied kann nicht entfernt werden.' }
    await payload.update({ collection: 'chat-room-members', id: String(target.id), data: { status: 'left' }, overrideAccess: true })
    revalidateChat()
    return { ok: true }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/**
 * Leave a room. Durable: the row flips to 'left' instead of being deleted, so
 * the project-room sync cannot silently re-add the member. Project membership
 * is deliberately untouched (leaving chat ≠ leaving the project). Owners must
 * transfer or delete instead.
 */
export async function leaveRoom(roomId: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const m = await getRoomMembership(payload, String(user.id), roomId, 'any')
    if (!m) return { error: 'Nicht Mitglied.' }
    if (m.status === 'left') return { ok: true }
    if (m.role === 'owner') return { error: 'Owner können den Raum nicht verlassen, nur löschen.' }
    await payload.update({ collection: 'chat-room-members', id: String(m.id), data: { status: 'left' }, overrideAccess: true })
    revalidateChat()
    return { ok: true }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/**
 * Re-enter a room previously left. Project rooms require the caller to still
 * be an active project member (and the chat module enabled); DMs can always be
 * rejoined; groups need a fresh invite from the owner instead.
 */
export async function rejoinRoom(roomId: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const m = await getRoomMembership(payload, String(user.id), roomId, 'any')
    if (!m || m.status !== 'left') return { error: 'Kein Wiedereintritt möglich.' }
    const room = await payload.findByID({ collection: 'chat-rooms', id: roomId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!room) return { error: 'Raum nicht gefunden.' }
    if (room.type === 'group') return { error: 'Für Gruppen ist eine neue Einladung nötig.' }
    if (room.type === 'project') {
      const projectId = relId(room.project)
      if (!projectId || !(await projectChatEnabled(payload, projectId))) return { error: 'Keine Berechtigung.' }
      const active = await payload.find({
        collection: 'project-memberships',
        where: { and: [{ user: { equals: user.id } }, { project: { equals: projectId } }, { status: { equals: 'active' } }] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (active.totalDocs === 0) return { error: 'Keine Berechtigung.' }
    }
    await payload.update({ collection: 'chat-room-members', id: String(m.id), data: { status: 'active' }, overrideAccess: true })
    revalidateChat()
    return { ok: true, roomId }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/** Room owner, project PM, or admin renames a room. */
export async function renameRoom(roomId: string, name: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name darf nicht leer sein.' }
  try {
    const payload = await getPayload({ config })
    const ctx = await requireRoomManager(payload, String(user.id), roomId, { isAdmin: user.role === 'admin' })
    if (!ctx) return { error: 'Keine Berechtigung.' }
    await payload.update({ collection: 'chat-rooms', id: roomId, data: { name: trimmed }, overrideAccess: true })
    revalidateChat()
    return { ok: true }
  } catch {
    return { error: 'Aktion fehlgeschlagen.' }
  }
}

/** Room owner, project PM, or admin deletes a room and its messages + memberships. */
export async function deleteRoom(roomId: string): Promise<ChatActionState> {
  const user = await getUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  try {
    const payload = await getPayload({ config })
    const ctx = await requireRoomManager(payload, String(user.id), roomId, { isAdmin: user.role === 'admin' })
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

/**
 * Re-sync a project room's members against current active project members.
 * PM-of-the-room's-project (or admin) only — like every export here, this is
 * a public server-action endpoint and must guard itself.
 */
export async function reconcileProjectRoomMembers(roomId: string): Promise<void> {
  const user = await getUser()
  if (!user) return
  const payload = await getPayload({ config })
  const room = await payload.findByID({ collection: 'chat-rooms', id: roomId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!room || room.type !== 'project') return
  const roomProjectId = relId(room.project)
  if (!roomProjectId) return
  if (user.role !== 'admin' && !(await isProjectManager(payload, String(user.id), roomProjectId))) return
  for (const uid of await activeProjectMemberIds(payload, roomProjectId)) {
    await addMember(payload, roomId, uid, { role: relId(room.createdBy) === uid ? 'owner' : 'member' })
  }
}
