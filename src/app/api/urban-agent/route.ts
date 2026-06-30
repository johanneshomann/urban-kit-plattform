import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { assembleProjectContext } from '@/modules/urban-agent/actions'
import { buildContextText, URBAN_AGENT_SYSTEM_PROMPT } from '@/lib/urban-agent/context'
import { chatComplete, resolveProvider, type ChatMessage } from '@/lib/urban-agent/llm'
import type { User, NewsPost, CalendarEvent, Poll, Project } from '@/payload-types'

const isChatMessage = (m: unknown): m is ChatMessage =>
  !!m && typeof m === 'object' &&
  ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
  typeof (m as ChatMessage).content === 'string'

// Urban Agent chat endpoint — answers questions about THIS project from content
// the viewer may already see (ADR-3 enforced in assembleProjectContext).
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!resolveProvider()) {
    return NextResponse.json({ error: 'not_configured', message: 'Der Assistent ist derzeit nicht konfiguriert.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const { projectId, messages } = body as { projectId?: string; messages?: unknown[] }
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const history = (Array.isArray(messages) ? messages : []).filter(isChatMessage).slice(-12)
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'last message must be from user' }, { status: 400 })
  }

  const context = await assembleProjectContext(user as unknown as User, projectId)
  const contextText = await buildContextText({
    project: context.project as unknown as Project | null,
    news: context.news as unknown as NewsPost[],
    events: context.events as unknown as CalendarEvent[],
    polls: context.polls as unknown as Poll[],
  })

  const system = `${URBAN_AGENT_SYSTEM_PROMPT}\n\n--- Projektkontext ---\n${contextText || '(Keine Inhalte verfügbar.)'}`

  try {
    const { text } = await chatComplete(system, history)
    return NextResponse.json({ reply: text || 'Dazu liegen mir keine Informationen vor.' })
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_CONFIGURED') {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }
    console.error('[urban-agent] LLM call failed:', err)
    return NextResponse.json({ error: 'llm_failed', message: 'Der Assistent ist momentan nicht erreichbar.' }, { status: 502 })
  }
}
