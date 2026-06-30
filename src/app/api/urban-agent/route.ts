import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { assembleProjectContext } from '@/modules/urban-agent/actions'
import type { User } from '@/payload-types'

// Streaming chat endpoint for Urban Agent
// Provider-agnostic: reads OPENAI_API_KEY / ANTHROPIC_API_KEY / OLLAMA_BASE_URL from env
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { projectId, messages } = body as { projectId?: string; messages?: unknown[] }

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  // Assemble context — only content the user can access (ADR-3 enforced in assembleProjectContext)
  const context = await assembleProjectContext(user as unknown as User, projectId)

  // Determine provider
  const provider = process.env.ANTHROPIC_API_KEY ? 'anthropic'
    : process.env.OPENAI_API_KEY ? 'openai'
    : 'ollama'

  // Return context summary for now — streaming AI responses wired in Phase 13 UI
  return NextResponse.json({
    provider,
    contextSummary: {
      project: (context.project as unknown as { title?: string })?.title,
      newsCount: context.news.length,
      eventsCount: context.events.length,
      pollsCount: context.polls.length,
    },
  })
}
