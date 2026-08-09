import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { Notification } from '@/payload-types'

/** Wire shape for one notification — reference resolved to title + app href. */
export interface NotificationItem {
  id: string
  type: string
  /** Resolved reference title (project/task/poll/post) — null if it vanished. */
  title: string | null
  /** App-relative href (locale-less) — the client prefixes the locale. */
  href: string | null
  read: boolean
  createdAt: string
}

const relId = (v: unknown): string | null =>
  v == null ? null : String(typeof v === 'object' ? (v as { id: unknown }).id : v)

// GET — the caller's latest notifications with resolved references.
// Reference docs are batch-fetched per collection; content docs additionally
// resolve their project for the workspace deep link.
export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await payload.find({
    collection: 'notifications',
    where: { user: { equals: user.id } },
    sort: '-createdAt',
    limit: 30,
    depth: 0,
    overrideAccess: true,
  })
  const docs = res.docs as Notification[]

  // Batch reference resolution
  const idsBySlug = new Map<string, Set<string>>()
  for (const n of docs) {
    const slug = n.reference?.collectionSlug
    const id = n.reference?.id
    if (!slug || !id) continue
    if (!idsBySlug.has(slug)) idsBySlug.set(slug, new Set())
    idsBySlug.get(slug)!.add(id)
  }

  type RefDoc = { id: string | number; title?: string | null; slug?: string | null; project?: unknown }
  const refByKey = new Map<string, RefDoc>()
  const SUPPORTED = new Set(['projects', 'tasks', 'polls', 'news-posts'])
  for (const [slug, ids] of idsBySlug) {
    if (!SUPPORTED.has(slug)) continue
    const found = await payload
      .find({ collection: slug as 'projects', where: { id: { in: [...ids] } }, limit: ids.size, depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] as RefDoc[] }))
    for (const doc of found.docs as RefDoc[]) refByKey.set(`${slug}:${doc.id}`, doc)
  }

  // Content refs (tasks/polls/news) need their project's slug for the link.
  const projectIds = new Set<string>()
  for (const [key, doc] of refByKey) {
    if (!key.startsWith('projects:')) {
      const pid = relId(doc.project)
      if (pid) projectIds.add(pid)
    }
  }
  const projectSlugById = new Map<string, string>()
  for (const [key, doc] of refByKey) {
    if (key.startsWith('projects:')) projectSlugById.set(String(doc.id), (doc as { slug?: string }).slug ?? '')
  }
  const missingProjectIds = [...projectIds].filter((id) => !projectSlugById.has(id))
  if (missingProjectIds.length) {
    const projects = await payload
      .find({ collection: 'projects', where: { id: { in: missingProjectIds } }, limit: missingProjectIds.length, depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] as RefDoc[] }))
    for (const p of projects.docs as RefDoc[]) projectSlugById.set(String(p.id), (p as { slug?: string }).slug ?? '')
  }

  const items: NotificationItem[] = docs.map((n) => {
    const refSlug = n.reference?.collectionSlug
    const refId = n.reference?.id
    const ref = refSlug && refId ? refByKey.get(`${refSlug}:${refId}`) : undefined

    let title: string | null = null
    let href: string | null = null
    if (ref) {
      title = (ref.title as string | null) ?? null
      if (refSlug === 'projects') {
        const slug = (ref as { slug?: string }).slug
        if (slug) {
          const base = `/dashboard/projekte/${slug}`
          href =
            n.type === 'join_request' ? `${base}/manage/anfragen`
            : n.type === 'member_joined' ? `${base}/manage/mitglieder`
            : base
        }
      } else {
        const projectSlug = projectSlugById.get(relId(ref.project) ?? '')
        if (projectSlug) {
          const base = `/dashboard/projekte/${projectSlug}`
          href =
            refSlug === 'tasks' ? `${base}/m/tasks`
            : refSlug === 'polls' ? `${base}/m/polls`
            : refSlug === 'news-posts' ? `${base}/m/news/${(ref as { slug?: string }).slug ?? ''}`
            : base
        }
      }
    }

    return {
      id: String(n.id),
      type: n.type,
      title,
      href,
      read: n.read === true,
      createdAt: n.createdAt,
    }
  })

  const unread = items.filter((i) => !i.read).length
  return NextResponse.json({ items, unread })
}

// POST { all: true } | { ids: string[] } — mark own notifications as read.
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const where: Where | null =
    body.all === true
      ? { and: [{ user: { equals: user.id } }, { read: { equals: false } }] }
      : Array.isArray(body.ids) && body.ids.length > 0
        ? { and: [{ user: { equals: user.id } }, { id: { in: body.ids.filter((v: unknown) => typeof v === 'string').slice(0, 100) } }] }
        : null
  if (!where) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  await payload.update({ collection: 'notifications', where, data: { read: true }, overrideAccess: true })
  return NextResponse.json({ ok: true })
}

// DELETE { all: true } | { ids: string[] } — delete own notifications.
export async function DELETE(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const where: Where | null =
    body.all === true
      ? { user: { equals: user.id } }
      : Array.isArray(body.ids) && body.ids.length > 0
        ? { and: [{ user: { equals: user.id } }, { id: { in: body.ids.filter((v: unknown) => typeof v === 'string').slice(0, 100) } }] }
        : null
  if (!where) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  await payload.delete({ collection: 'notifications', where, overrideAccess: true })
  return NextResponse.json({ ok: true })
}
