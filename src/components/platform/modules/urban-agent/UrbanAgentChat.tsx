// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Send, Sparkles, ShieldCheck, ExternalLink } from 'lucide-react'

/** Card reference resolved server-side (ids validated against tool results). */
type AgentItem = { module: string; id: string; title: string; slug?: string }
type ChatMessage = { role: 'user' | 'assistant'; content: string; items?: AgentItem[] }

const MODULE_LABELS: Record<string, string> = {
  news: 'Neuigkeiten',
  calendar: 'Termine',
  polls: 'Umfragen',
  forum: 'Forum',
  tasks: 'Aufgaben',
  files: 'Dateien',
}

/** News and forum have item detail routes (by slug); everything else links to the module page. */
const itemHref = (locale: string, projectSlug: string, item: AgentItem): string => {
  const root = `/${locale}/dashboard/projekte/${projectSlug}/m`
  if ((item.module === 'news' || item.module === 'forum') && item.slug) {
    return `${root}/${item.module}/${item.slug}`
  }
  return `${root}/${item.module}`
}

export function UrbanAgentChat({ projectId, projectSlug }: { projectId: string; projectSlug: string }) {
  const locale = useLocale()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const scrollDown = () => requestAnimationFrame(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  })

  const send = async () => {
    const text = input.trim()
    if (!text || pending) return
    setError(null)
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setPending(true)
    scrollDown()
    try {
      const res = await fetch('/api/urban-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Cards are display-only — the API expects bare role/content messages.
        body: JSON.stringify({ projectId, messages: next.map(({ role, content }) => ({ role, content })) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          data?.message ||
            (res.status === 429
              ? 'Zu viele Anfragen. Bitte warten Sie einen Moment.'
              : res.status === 503
                ? 'Der Assistent ist derzeit nicht konfiguriert.'
                : 'Der Assistent ist momentan nicht erreichbar.'),
        )
        return
      }
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.reply ?? '', items: Array.isArray(data.items) ? data.items : undefined },
      ])
      scrollDown()
    } catch {
      setError('Verbindung fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 text-display font-bold mb-2" style={{ color: 'var(--project-accent)' }}>
        <Sparkles className="w-5 h-5" /> Urban-Agent
      </h2>
      <p className="text-text mb-4" style={{ color: 'var(--project-ink)' }}>
        Stellen Sie Fragen zu diesem Projekt. Der Assistent antwortet ausschließlich auf Grundlage der für Sie sichtbaren Projektinhalte.
      </p>

      <div className="flex items-start gap-2 mb-5 px-4 py-3 rounded-lg text-small" style={{ background: 'var(--project-light)', color: 'var(--project-accent)' }}>
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ opacity: 0.7 }} />
        <span style={{ opacity: 0.8 }}>
          Datenschutz: Ihre Fragen sowie öffentliche Projektinhalte werden zur Beantwortung an einen KI-Dienst übermittelt. Es werden keine personenbezogenen Daten anderer Teilnehmender weitergegeben. Geben Sie keine sensiblen persönlichen Daten ein.{' '}
          {/* New tab: the transcript lives only in memory and would be lost by navigating away. */}
          <a
            href={`/${locale}/datenschutz`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-70 transition-opacity"
          >
            Mehr in der Datenschutzerklärung
          </a>
        </span>
      </div>

      <div ref={listRef} className="flex flex-col gap-3 mb-4 max-h-[55vh] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-text" style={{ color: 'var(--project-ink)' }}>
            Noch keine Nachrichten. Fragen Sie zum Beispiel: „Welche Termine stehen an?“
          </p>
        ) : messages.map((m, i) => (
          <div key={i} className={`rounded-xl border px-4 py-3 max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}
            style={{
              background: m.role === 'user' ? 'var(--project-dark)' : 'var(--project-white)',
              color: m.role === 'user' ? 'var(--project-black)' : 'var(--project-accent)',
              borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)',
            }}>
            <p className="text-text whitespace-pre-wrap">{m.content}</p>
            {m.items && m.items.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {m.items.map((item) => (
                  <li key={`${item.module}:${item.id}`}>
                    <Link
                      href={itemHref(locale, projectSlug, item)}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-opacity hover:opacity-80"
                      style={{
                        background: 'var(--project-light)',
                        borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)',
                        color: 'var(--project-accent)',
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block text-small font-bold truncate">{item.title}</span>
                        <span className="block text-small" style={{ color: 'var(--project-ink)' }}>
                          {MODULE_LABELS[item.module] ?? item.module}
                        </span>
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {pending && (
          <div className="rounded-xl border px-4 py-3 self-start" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)', color: 'var(--project-ink)' }}>
            <p className="text-text">Der Assistent denkt nach …</p>
          </div>
        )}
      </div>

      {error && <p className="text-small mb-3" style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="rounded-xl border p-3" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          rows={2}
          placeholder="Ihre Frage zum Projekt …"
          className="w-full px-3 py-2 rounded-lg border text-text outline-none"
          style={{ borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }}
        />
        <div className="flex justify-end mt-2">
          <button type="button" onClick={send} disabled={pending || !input.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-cta font-semibold transition-opacity disabled:opacity-40"
            style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
            <Send className="w-4 h-4" /> Senden
          </button>
        </div>
      </div>
    </section>
  )
}
