import { NextRequest, NextResponse } from 'next/server'
import { authUser } from '@/lib/chat/route-auth'
import { serializeUserRef } from '@/lib/chat/serialize'
import type { User } from '@/payload-types'

// GET ?q= — search users for the DM/group picker. Returns id + name + avatar only (GDPR).
export async function GET(req: NextRequest) {
  const a = await authUser(req)
  if ('error' in a) return a.error
  const { payload, userId } = a

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ users: [] })

  const res = await payload.find({
    collection: 'users',
    where: {
      and: [
        { id: { not_equals: userId } },
        { or: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }] },
      ],
    },
    limit: 10, depth: 1, overrideAccess: true,
  })
  const users = (res.docs as User[]).map((u) => serializeUserRef(u))
  return NextResponse.json({ users })
}
