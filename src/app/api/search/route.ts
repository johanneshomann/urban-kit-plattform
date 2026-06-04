import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { searchProject } from '@/lib/search'
import type { User } from '@/payload-types'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const query = searchParams.get('q') ?? ''
  const projectId = searchParams.get('project') ?? ''

  if (!projectId) return NextResponse.json({ error: 'project required' }, { status: 400 })

  const results = await searchProject(user as unknown as User, projectId, query)
  return NextResponse.json({ results })
}
