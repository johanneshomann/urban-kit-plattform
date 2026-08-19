// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight, Bot, Send } from 'lucide-react'
import { SUGGESTED_PROMPTS, urbanAgentAskKey } from '@/components/platform/modules/urban-agent/UrbanAgentChat'

/**
 * Urban-Agent pointer card on the workspace overview: question input plus the
 * chat's suggested prompts. Submitting stores the question in the chat's
 * handoff slot and navigates to the agent page, which auto-sends it.
 * Prompt strings stay German like the whole agent module.
 */
export function UrbanAgentOverviewCard({ slug, base }: {
  slug: string
  /** Absolute workspace prefix (`/{locale}/dashboard/projekte/{slug}`). */
  base: string
}) {
  const tw = useTranslations('projectWorkspace')
  const router = useRouter()
  const [q, setQ] = useState('')

  const agentHref = `${base}/m/urban-agent`

  const ask = (text: string) => {
    const question = text.trim()
    if (!question) return
    try {
      sessionStorage.setItem(urbanAgentAskKey(slug), question)
    } catch {
      /* storage blocked — the agent page just opens empty */
    }
    router.push(agentHref)
  }

  return (
    <div
      className="rounded-xl border p-4 md:p-5 flex flex-col gap-3"
      style={{
        background: 'color-mix(in srgb, var(--project-accent) 8%, var(--project-white))',
        borderColor: 'color-mix(in srgb, var(--project-accent) 25%, transparent)',
      }}
    >
      <Link href={agentHref} className="group flex items-center gap-4">
        <span
          className="flex w-10 h-10 items-center justify-center rounded-full shrink-0"
          style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
        >
          <Bot aria-hidden="true" className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold" style={{ color: 'var(--project-accent)' }}>{tw('agentCardTitle')}</span>
          <span className="block text-small" style={{ color: 'var(--project-ink)' }}>{tw('agentCardBody')}</span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: 'var(--project-accent)' }}
        />
      </Link>

      {/* Question input — Enter or the send button hands off to the agent page */}
      <div
        className="flex items-center gap-2 rounded-lg border pl-3 pr-1.5 py-1.5"
        style={{
          background: 'var(--project-white)',
          borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)',
        }}
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ask(q) } }}
          placeholder="Ihre Frage zum Projekt …"
          aria-label={tw('agentCardTitle')}
          className="flex-1 min-w-0 bg-transparent text-small outline-none placeholder:opacity-60"
          style={{ color: 'var(--project-accent)' }}
        />
        <button
          type="button"
          onClick={() => ask(q)}
          disabled={!q.trim()}
          aria-label="Senden"
          className="flex items-center justify-center w-8 h-8 rounded-md transition-opacity disabled:opacity-40 cursor-pointer"
          style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}
        >
          <Send aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>

      {/* Same suggestions as the chat's empty state — clicking asks directly */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => ask(p)}
            className="text-small px-3 py-1.5 rounded-full border transition-colors cursor-pointer hover:bg-[var(--project-light)]"
            style={{
              background: 'var(--project-white)',
              color: 'var(--project-accent)',
              borderColor: 'color-mix(in srgb, var(--project-general) 35%, transparent)',
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
