import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

// ADR-1: Hocuspocus calls this endpoint server-to-server to authorize a WebSocket room.
// roomName format: "<moduleType>:<projectSlug>:<resourceId>"
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-hocuspocus-secret')
  if (secret !== process.env.HOCUSPOCUS_SECRET) {
    return NextResponse.json({ authorized: false }, { status: 401 })
  }

  const body = await req.json()
  const { token, roomName } = body as { token?: string; roomName?: string }

  if (!token || !roomName) {
    return NextResponse.json({ authorized: false }, { status: 400 })
  }

  const payload = await getPayload({ config })

  try {
    const { user } = await payload.auth({
      headers: new Headers({ Authorization: `JWT ${token}` }),
    })

    if (!user) {
      return NextResponse.json({ authorized: false }, { status: 401 })
    }

    // TODO Phase 11: parse roomName, check project membership + module enabled
    // For now: any authenticated user is authorized (safe placeholder)
    return NextResponse.json({ authorized: true, userId: user.id })
  } catch {
    return NextResponse.json({ authorized: false }, { status: 401 })
  }
}
