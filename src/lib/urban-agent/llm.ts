import 'server-only'

/**
 * Provider-agnostic chat completion via raw fetch (no SDK dependency).
 * Picks Anthropic → OpenAI → Ollama based on which env vars are present.
 */

export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type LlmProvider = 'anthropic' | 'openai' | 'ollama'

export function resolveProvider(): LlmProvider | null {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.OLLAMA_BASE_URL) return 'ollama'
  return null
}

const MAX_TOKENS = 1024

async function callAnthropic(system: string, messages: ChatMessage[]): Promise<string> {
  // Anthropic Messages API — https://api.anthropic.com/v1/messages
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY as string,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: MAX_TOKENS, system, messages }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { content?: { type: string; text?: string }[] }
  return (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('').trim()
}

async function callOpenAI(system: string, messages: ChatMessage[]): Promise<string> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: MAX_TOKENS, messages: [{ role: 'system', content: system }, ...messages] }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return (data.choices?.[0]?.message?.content ?? '').trim()
}

async function callOllama(system: string, messages: ChatMessage[]): Promise<string> {
  const base = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '')
  const model = process.env.OLLAMA_MODEL || 'llama3'
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, stream: false, messages: [{ role: 'system', content: system }, ...messages] }),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { message?: { content?: string } }
  return (data.message?.content ?? '').trim()
}

/** Run one chat turn against the configured provider. Returns the assistant text. */
export async function chatComplete(system: string, messages: ChatMessage[]): Promise<{ provider: LlmProvider; text: string }> {
  const provider = resolveProvider()
  if (!provider) throw new Error('NOT_CONFIGURED')
  const text =
    provider === 'anthropic' ? await callAnthropic(system, messages)
    : provider === 'openai' ? await callOpenAI(system, messages)
    : await callOllama(system, messages)
  return { provider, text }
}
