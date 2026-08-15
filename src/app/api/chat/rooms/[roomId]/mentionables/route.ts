// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { NextRequest, NextResponse } from 'next/server'
import { authRoom } from '@/lib/chat/route-auth'
import { relId } from '@/lib/chat/access'
import { searchMentionables } from '@/lib/chat/mentionables'

// GET ?q= — content of the room's project the CALLER may mention (and see).
// Only rooms with a project context (project rooms, project-assigned groups)
// have mentionables; everything else returns an empty list.
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const a = await authRoom(req, roomId)
  if ('error' in a) return a.error

  const projectId = relId(a.ctx.room.project)
  if (!projectId) return NextResponse.json({ items: [] })

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const items = await searchMentionables(a.payload, a.userId, projectId, q)
  return NextResponse.json({ items })
}
