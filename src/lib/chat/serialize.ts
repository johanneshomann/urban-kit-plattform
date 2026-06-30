import 'server-only'
import type { Payload } from 'payload'
import type { ChatMessage, User, Media } from '@/payload-types'
import { relId } from '@/lib/chat/access'

export interface UserRef {
  id: string
  name: string
  avatarUrl: string | null
}

export function personName(u: unknown): string {
  if (!u || typeof u !== 'object') return 'Unbekannt'
  const o = u as { firstName?: string | null; lastName?: string | null; email?: string }
  return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
}

function mediaUrl(v: unknown): string | null {
  if (!v || typeof v !== 'object') return null
  return (v as Media).url ?? null
}

export function serializeUserRef(u: unknown): UserRef {
  const id = relId(u) ?? ''
  if (!u || typeof u !== 'object') return { id, name: 'Unbekannt', avatarUrl: null }
  return { id, name: personName(u), avatarUrl: mediaUrl((u as User).avatar) }
}

export interface MessageDTO {
  id: string
  content: string
  author: UserRef
  attachment: { url: string; filename: string | null; mimeType: string | null } | null
  reactions: { emoji: string; count: number; mine: boolean }[]
  createdAt: string
}

export function serializeMessage(doc: ChatMessage, viewerId: string): MessageDTO {
  const att = doc.attachment && typeof doc.attachment === 'object' ? (doc.attachment as Media) : null
  const byEmoji = new Map<string, { count: number; mine: boolean }>()
  for (const r of doc.reactions ?? []) {
    const entry = byEmoji.get(r.emoji) ?? { count: 0, mine: false }
    entry.count += 1
    if (relId(r.user) === viewerId) entry.mine = true
    byEmoji.set(r.emoji, entry)
  }
  return {
    id: String(doc.id),
    content: doc.content ?? '',
    author: serializeUserRef(doc.author),
    attachment: att?.url ? { url: att.url, filename: att.filename ?? null, mimeType: att.mimeType ?? null } : null,
    reactions: [...byEmoji.entries()].map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine })),
    createdAt: doc.createdAt,
  }
}

/** Count unread messages in a room (newer than lastReadAt, not authored by the viewer). */
export async function unreadCount(payload: Payload, roomId: string, viewerId: string, lastReadAt?: string | null): Promise<number> {
  const and: Record<string, unknown>[] = [{ room: { equals: roomId } }, { author: { not_equals: viewerId } }]
  if (lastReadAt) and.push({ createdAt: { greater_than: lastReadAt } })
  const res = await payload.count({ collection: 'chat-messages', where: { and } as never, overrideAccess: true })
  return res.totalDocs
}
