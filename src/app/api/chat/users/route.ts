// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { NextRequest, NextResponse } from 'next/server'
import { authUser } from '@/lib/chat/route-auth'
import { findPeople } from '@/lib/people-search'

// GET ?q= — search users for the DM/group picker. Delegates to the platform
// people-search policy (name-only matching, profile-visibility honoured,
// admins and self excluded) instead of the old raw user query, which was an
// e-mail-substring enumeration oracle. The shared projects double as the
// "who is this person" context in the picker.
export async function GET(req: NextRequest) {
  const a = await authUser(req)
  if ('error' in a) return a.error

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ users: [] })

  const people = await findPeople(a.userId, { query: q })
  const users = people.map((p) => ({
    id: p.id,
    name: p.name || null,
    avatarUrl: p.avatarUrl,
    sharedProjects: p.sharedProjects.map(({ id, title, light, accent }) => ({ id, title, light, accent })),
  }))
  return NextResponse.json({ users })
}
