import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getViewerTier } from '@/lib/visibility'

// ADR-1: Hocuspocus calls this server-to-server to authorize a WebSocket room.
// roomName format: "<moduleType>:<projectSlug>:<resourceId>" — currently only "board".
const deny = () => NextResponse.json({ authorized: false }, { status: 401 })

const relId = (v: unknown): string | null =>
  v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v)

export async function POST(req: NextRequest) {
  if (req.headers.get('x-hocuspocus-secret') !== process.env.HOCUSPOCUS_SECRET) return deny()

  const { token, roomName } = (await req.json().catch(() => ({}))) as { token?: string; roomName?: string }
  if (!token || !roomName) return NextResponse.json({ authorized: false }, { status: 400 })

  const [moduleType, projectSlug, resourceId] = roomName.split(':')
  if (moduleType !== 'board' || !projectSlug || !resourceId) return deny()

  const payload = await getPayload({ config })

  try {
    const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
    if (!user) return deny()

    const projectRes = await payload.find({ collection: 'projects', where: { slug: { equals: projectSlug } }, limit: 1, depth: 0, overrideAccess: true })
    const project = projectRes.docs[0] as { id: string; modules?: string[] | null } | undefined
    if (!project || !(project.modules ?? []).includes('board')) return deny()

    // The canvas must belong to this project
    const canvas = await payload.findByID({ collection: 'board-canvases', id: resourceId, depth: 0, overrideAccess: true }).catch(() => null)
    if (!canvas || relId((canvas as { project?: unknown }).project) !== String(project.id)) return deny()

    // Board access = any active project member (tier !== 'public')
    const tier = await getViewerTier(payload, String(user.id), String(project.id))
    if (tier === 'public') return deny()

    return NextResponse.json({ authorized: true, userId: user.id })
  } catch {
    return deny()
  }
}
