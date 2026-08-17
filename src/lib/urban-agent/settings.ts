// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'

import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Resolves the Urban Agent configuration from the `urban-agent-settings`
 * admin global, with environment variables as fallback (so the API key can
 * stay in the server env instead of the database).
 *
 * Precedence per field: global value → env var → default. The provider is
 * special: an explicit choice (global, then URBAN_AGENT_PROVIDER) wins;
 * otherwise it is auto-detected from which key is present — in the legacy
 * priority order (Anthropic → OpenAI → Mistral → Ollama) so existing
 * deployments that only set ANTHROPIC_API_KEY keep working unchanged.
 *
 * Deliberately NO cross-provider failover: a provider outage is an honest
 * 502, never a silent switch of the data processor (GDPR).
 *
 * Cached briefly so a busy chat doesn't re-read the global on every turn;
 * admin changes take effect within the TTL.
 */

export type AgentProvider = 'anthropic' | 'openai' | 'mistral' | 'ollama'

export type UrbanAgentSettings = {
  enabled: boolean
  provider: AgentProvider | null
  model?: string
  apiKey?: string
  instructions?: string
  rateLimit: number
  /** enabled AND the selected provider is usable (key present / Ollama URL set). */
  configured: boolean
}

const PROVIDERS: AgentProvider[] = ['anthropic', 'openai', 'mistral', 'ollama']

const ENV_KEY: Record<Exclude<AgentProvider, 'ollama'>, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
}

const CACHE_TTL_MS = 30 * 1000
const cache = new Map<string, { at: number; data: UrbanAgentSettings }>()

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function pickProvider(value: unknown): AgentProvider | null {
  if (typeof value === 'string' && PROVIDERS.includes(value as AgentProvider)) {
    return value as AgentProvider
  }
  const env = (process.env.URBAN_AGENT_PROVIDER || '').toLowerCase()
  if (PROVIDERS.includes(env as AgentProvider)) return env as AgentProvider
  // Auto-detect (legacy behavior): first provider with credentials wins.
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.MISTRAL_API_KEY) return 'mistral'
  if (process.env.OLLAMA_BASE_URL) return 'ollama'
  return null
}

export async function loadUrbanAgentSettings(locale: 'de' | 'en' = 'de'): Promise<UrbanAgentSettings> {
  const cached = cache.get(locale)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data

  let g: Record<string, unknown> = {}
  try {
    const payload = await getPayload({ config })
    g = (await payload.findGlobal({
      slug: 'urban-agent-settings',
      locale,
      fallbackLocale: 'de',
      overrideAccess: true,
    })) as unknown as Record<string, unknown>
  } catch {
    // Global not yet created / DB unavailable → fall back to env entirely.
  }

  const provider = pickProvider(g.provider)
  const apiKey =
    provider && provider !== 'ollama' ? str(g.apiKey) || str(process.env[ENV_KEY[provider]]) : undefined
  const enabled = g.enabled !== false // default on; only an explicit toggle-off disables
  const usable =
    provider === 'ollama' ? Boolean(str(process.env.OLLAMA_BASE_URL)) : Boolean(apiKey)

  const data: UrbanAgentSettings = {
    enabled,
    provider,
    model: str(g.model) || str(process.env.URBAN_AGENT_MODEL),
    apiKey,
    instructions: str(g.instructions),
    rateLimit: typeof g.rateLimit === 'number' && g.rateLimit > 0 ? g.rateLimit : 20,
    configured: enabled && provider !== null && usable,
  }

  cache.set(locale, { at: Date.now(), data })
  return data
}
