import 'server-only'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import type { Payload } from 'payload'
import { requireRoomMember, type RoomContext } from '@/lib/chat/access'

type AuthOk = { payload: Payload; userId: string }
type AuthErr = { error: NextResponse }

/** Authenticate a chat route request. */
export async function authUser(req: Request): Promise<AuthOk | AuthErr> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    // TEMP DEBUG (dm 401 investigation): what did the request carry?
    const cookie = req.headers.get('cookie') ?? ''
    console.warn('[chat-auth] 401', req.method, new URL(req.url).pathname, {
      hasCookieHeader: cookie.length > 0,
      hasPayloadToken: cookie.includes('payload-token='),
      hasAuthHeader: !!req.headers.get('authorization'),
    })
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { payload, userId: String(user.id) }
}

/** Authenticate + require the caller be an active member of `roomId`. */
export async function authRoom(req: Request, roomId: string): Promise<(AuthOk & { ctx: RoomContext }) | AuthErr> {
  const a = await authUser(req)
  if ('error' in a) return a
  const ctx = await requireRoomMember(a.payload, a.userId, roomId)
  if (!ctx) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { ...a, ctx }
}
