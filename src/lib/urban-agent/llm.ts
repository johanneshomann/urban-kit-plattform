// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import 'server-only'

import { generateText, stepCountIs, type LanguageModel, type SystemModelMessage, type ToolSet } from 'ai'
import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { mistral, createMistral } from '@ai-sdk/mistral'
import { createOpenAI, openai } from '@ai-sdk/openai'
import type { AgentProvider, UrbanAgentSettings } from './settings'

/**
 * One chat turn against the configured provider (Vercel AI SDK). Which
 * provider runs is decided in settings.ts — deliberately no cross-provider
 * failover (see there). Ollama has no first-party AI-SDK provider and is
 * driven through its OpenAI-compatible endpoint, which also makes the output
 * token cap apply there.
 */

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export const DEFAULT_MODEL: Record<AgentProvider, string> = {
  anthropic: 'claude-haiku-4-5',
  openai: 'gpt-4o-mini',
  mistral: 'mistral-small-latest',
  ollama: 'llama3',
}

/** Cost ceiling per reply; long answers are not this assistant's job. */
const MAX_OUTPUT_TOKENS = 800
/** A hanging provider must not hold the serverless invocation open. */
const TIMEOUT_MS = 60_000
/** Tool-loop budget: retrieval steps + the final answer. */
const MAX_STEPS = 8

function buildModel(provider: AgentProvider, modelId?: string, apiKey?: string): LanguageModel {
  const id = modelId || DEFAULT_MODEL[provider]
  switch (provider) {
    case 'openai':
      return (apiKey ? createOpenAI({ apiKey }) : openai)(id)
    case 'mistral':
      return (apiKey ? createMistral({ apiKey }) : mistral)(id)
    case 'ollama': {
      const base = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '')
      return createOpenAI({ baseURL: `${base}/v1`, apiKey: 'ollama' })(
        modelId || process.env.OLLAMA_MODEL || DEFAULT_MODEL.ollama,
      )
    }
    default:
      return (apiKey ? createAnthropic({ apiKey }) : anthropic)(id)
  }
}

export async function chatComplete(
  settings: UrbanAgentSettings,
  system: string,
  messages: ChatMessage[],
  tools?: ToolSet,
): Promise<{ provider: AgentProvider; text: string }> {
  if (!settings.configured || !settings.provider) throw new Error('NOT_CONFIGURED')

  const systemMessage: SystemModelMessage = { role: 'system', content: system }
  if (settings.provider === 'anthropic') {
    // The system prompt (rules + project context) repeats across a chat
    // session — cache it. Other providers ignore this option.
    systemMessage.providerOptions = {
      anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
    }
  }

  const result = await generateText({
    model: buildModel(settings.provider, settings.model, settings.apiKey),
    // ai v7: system messages live in `instructions`, not in `messages`.
    instructions: systemMessage,
    messages,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  })

  // Count-only accounting (no content) — enough to notice runaway cost.
  const { inputTokens, outputTokens } = result.usage
  console.info(`[urban-agent] ${settings.provider} tokens in=${inputTokens ?? '?'} out=${outputTokens ?? '?'}`)

  return { provider: settings.provider, text: result.text.trim() }
}
