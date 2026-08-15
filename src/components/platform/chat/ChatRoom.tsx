// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Send, Paperclip, Smile, X, ChevronUp, Newspaper, CalendarDays, MessageSquare, CheckSquare, BarChart2, FolderOpen, Kanban, Hash } from 'lucide-react'
import type { MentionableItem, MessageDTO } from './types'

const QUICK_EMOJI = ['👍', '❤️', '😄', '🎉', '🙏']
const POLL_MS = 3000
const PAGE_SIZE = 50

const MENTION_ICONS: Record<string, typeof Newspaper> = {
  news: Newspaper,
  calendar: CalendarDays,
  forum: MessageSquare,
  tasks: CheckSquare,
  polls: BarChart2,
  files: FolderOpen,
  board: Kanban,
}

function MentionIcon({ module, className }: { module: string; className?: string }) {
  const Icon = MENTION_ICONS[module] ?? Hash
  return <Icon className={className} aria-hidden />
}

/**
 * Message view inside the chat popup. Polls incrementally (after-cursor),
 * pages backwards with the before-cursor, and reports send/read activity up
 * so the overview badge refreshes. In rooms with a project context, typing
 * `#` mentions project content (server-validated snapshots rendered as
 * deep-link chips). Colors inherit the chameleon (`--project-*` with
 * `--app-*` fallbacks). The popup owns the header.
 */
export function ChatRoom({
  roomId,
  projectSlug,
  onActivity,
}: {
  roomId: string
  /** Project context — enables content mentions and prefixes their links. */
  projectSlug?: string | null
  onActivity?: () => void
}) {
  const t = useTranslations('chat')
  const locale = useLocale()
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [typing, setTyping] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [attachment, setAttachment] = useState<{ id: string; url: string | null } | null>(null)
  const [reactingId, setReactingId] = useState<string | null>(null)
  // Content-mention typeahead ('#' in rooms with a project context)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionItems, setMentionItems] = useState<MentionableItem[]>([])
  const [mentionIndex, setMentionIndex] = useState(0)
  const [pendingMentions, setPendingMentions] = useState<MentionableItem[]>([])
  const cursorRef = useRef<string | null>(null)
  const lastTypingSent = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const ink = 'var(--project-ink, var(--app-ink))'
  const accent = 'var(--project-accent, var(--app-accent))'
  const hairline = 'color-mix(in srgb, var(--project-ink, var(--app-ink)) 12%, transparent)'

  const scrollDown = () => requestAnimationFrame(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  })

  const merge = useCallback((incoming: MessageDTO[], opts: { scroll?: boolean } = {}) => {
    if (incoming.length === 0) return
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]))
      for (const m of incoming) byId.set(m.id, m)
      const all = [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      cursorRef.current = all[all.length - 1]?.createdAt ?? cursorRef.current
      return all
    })
    if (opts.scroll !== false) scrollDown()
  }, [])

  // Reset + initial load (newest page) when the room changes
  useEffect(() => {
    let active = true
    setMessages([]); setTyping([]); setHasOlder(false); cursorRef.current = null
    ;(async () => {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`).then((r) => r.json()).catch(() => null)
      if (!active || !res) return
      merge(res.messages ?? [])
      setHasOlder((res.messages ?? []).length >= PAGE_SIZE)
      setTyping(res.typing ?? [])
      fetch(`/api/chat/rooms/${roomId}/read`, { method: 'POST' }).catch(() => {})
      onActivity?.()
    })()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, merge])

  // Incremental poll
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return
      const after = cursorRef.current ? `?after=${encodeURIComponent(cursorRef.current)}` : ''
      const res = await fetch(`/api/chat/rooms/${roomId}/messages${after}`).then((r) => r.json()).catch(() => null)
      if (!res) return
      merge(res.messages ?? [])
      setTyping(res.typing ?? [])
      if ((res.messages ?? []).length) {
        fetch(`/api/chat/rooms/${roomId}/read`, { method: 'POST' }).catch(() => {})
        onActivity?.()
      }
    }, POLL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, merge])

  /** Scroll-back: prepend the previous page, keeping the viewport position. */
  const loadOlder = async () => {
    const oldest = messages[0]?.createdAt
    if (!oldest) return
    const el = scrollRef.current
    const prevHeight = el?.scrollHeight ?? 0
    const res = await fetch(`/api/chat/rooms/${roomId}/messages?before=${encodeURIComponent(oldest)}`)
      .then((r) => r.json())
      .catch(() => null)
    if (!res) return
    const older = (res.messages ?? []) as MessageDTO[]
    setHasOlder(older.length >= PAGE_SIZE)
    merge(older, { scroll: false })
    requestAnimationFrame(() => {
      if (el) el.scrollTop += el.scrollHeight - prevHeight
    })
  }

  const sendTyping = () => {
    const now = Date.now()
    if (now - lastTypingSent.current < 2500) return
    lastTypingSent.current = now
    fetch(`/api/chat/rooms/${roomId}/typing`, { method: 'POST' }).catch(() => {})
  }

  /** '#token' at the end of the input opens the content-mention typeahead. */
  const detectMention = (value: string) => {
    if (!projectSlug) return
    const match = value.match(/(?:^|\s)#([^\s#]{0,40})$/)
    setMentionQuery(match ? match[1] : null)
    setMentionIndex(0)
  }

  // Debounced mentionables fetch while the typeahead is open.
  useEffect(() => {
    if (mentionQuery === null || !projectSlug) {
      setMentionItems([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/chat/rooms/${roomId}/mentionables?q=${encodeURIComponent(mentionQuery)}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
      if (active && res) setMentionItems(res.items ?? [])
    }, 200)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [mentionQuery, roomId, projectSlug])

  const selectMention = (item: MentionableItem) => {
    setPendingMentions((prev) =>
      prev.some((m) => m.module === item.module && m.docId === item.docId) || prev.length >= 5 ? prev : [...prev, item],
    )
    // Strip the '#token' the user was typing.
    setInput((prev) => prev.replace(/(?:^|\s)#[^\s#]{0,40}$/, (s) => (s.startsWith(' ') ? ' ' : '')))
    setMentionQuery(null)
    setMentionItems([])
  }

  const send = async () => {
    const content = input.trim()
    if ((!content && !attachment && pendingMentions.length === 0) || pending) return
    setPending(true)
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content,
          attachmentId: attachment?.id,
          mentions: pendingMentions.map((m) => ({ module: m.module, id: m.docId })),
        }),
      }).then((r) => r.json()).catch(() => null)
      if (res?.message) merge([res.message])
      setInput(''); setAttachment(null); setPendingMentions([]); setMentionQuery(null)
      onActivity?.()
    } finally {
      setPending(false)
    }
  }

  const uploadFile = async (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/chat/attachments', { method: 'POST', body: fd }).then((r) => r.json()).catch(() => null)
    if (res?.id) setAttachment({ id: res.id, url: res.url })
  }

  const toggleReaction = async (messageId: string, emoji: string) => {
    setReactingId(null)
    // optimistic
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m
      const ex = m.reactions.find((r) => r.emoji === emoji)
      let reactions = m.reactions
      if (ex) {
        reactions = ex.mine
          ? m.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r).filter((r) => r.count > 0)
          : m.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r)
      } else {
        reactions = [...m.reactions, { emoji, count: 1, mine: true }]
      }
      return { ...m, reactions }
    }))
    await fetch(`/api/chat/rooms/${roomId}/reactions`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messageId, emoji }),
    }).catch(() => {})
  }

  const typingLabel =
    typing.length === 0 ? null : typing.length === 1 ? t('typingOne', { name: typing[0] }) : t('typingMany', { names: typing.join(', ') })

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {hasOlder && (
          <button
            type="button"
            onClick={loadOlder}
            className="self-center inline-flex items-center gap-1 text-small opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: ink }}
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            {t('loadOlder')}
          </button>
        )}
        {messages.length === 0 && <p className="text-small opacity-50 m-auto" style={{ color: ink }}>{t('noMessages')}</p>}
        {messages.map((m) => (
          <div key={m.id} className="group flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-small font-semibold" style={{ color: 'var(--project-accent, var(--app-ink-accent))' }}>
                {m.author.name ?? t('unknownUser')}
              </span>
              <span className="text-small opacity-40" style={{ color: ink }}>
                {new Date(m.createdAt).toLocaleTimeString(locale === 'en' ? 'en-GB' : 'de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                type="button"
                onClick={() => setReactingId(reactingId === m.id ? null : m.id)}
                aria-label={t('addReaction')}
                aria-expanded={reactingId === m.id}
                className="opacity-0 group-hover:opacity-60 focus-visible:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer"
                style={{ color: ink }}
              >
                <Smile className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
            {m.content && <p className="text-text whitespace-pre-wrap" style={{ color: ink }}>{m.content}</p>}
            {(m.mentions?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {m.mentions.map((mention, mi) =>
                  projectSlug ? (
                    <Link
                      key={`${mention.href}-${mi}`}
                      href={`/${locale}/dashboard/projekte/${projectSlug}${mention.href}`}
                      className="inline-flex items-center gap-1 text-small px-2 py-0.5 rounded-full max-w-full truncate transition-colors bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_18%,transparent)]"
                      style={{ color: accent }}
                    >
                      <MentionIcon module={mention.module} className="h-3 w-3 shrink-0" />
                      <span className="truncate">{mention.title}</span>
                    </Link>
                  ) : (
                    <span key={`${mention.href}-${mi}`} className="inline-flex items-center gap-1 text-small px-2 py-0.5 rounded-full max-w-full truncate bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_8%,transparent)]" style={{ color: ink }}>
                      <MentionIcon module={mention.module} className="h-3 w-3 shrink-0" />
                      <span className="truncate">{mention.title}</span>
                    </span>
                  ),
                )}
              </div>
            )}
            {m.attachment?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.attachment.url} alt={m.attachment.filename ?? ''} className="max-w-60 rounded-lg shadow-sm" />
            )}
            <div className="flex items-center gap-1 flex-wrap">
              {m.reactions.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  onClick={() => toggleReaction(m.id, r.emoji)}
                  aria-pressed={r.mine}
                  aria-label={`${r.emoji} ${r.count}`}
                  className="text-small px-1.5 py-0.5 rounded-full shadow-sm cursor-pointer transition-colors"
                  style={{
                    background: r.mine ? 'color-mix(in srgb, ' + accent + ' 14%, transparent)' : 'transparent',
                    boxShadow: r.mine ? `inset 0 0 0 1px ${accent}` : `inset 0 0 0 1px ${hairline}`,
                    color: ink,
                  }}
                >
                  {r.emoji} {r.count}
                </button>
              ))}
              {reactingId === m.id && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-sm" style={{ background: 'var(--project-white, var(--app-white))', boxShadow: `inset 0 0 0 1px ${hairline}` }}>
                  {QUICK_EMOJI.map((e) => (
                    <button key={e} type="button" onClick={() => toggleReaction(m.id, e)} aria-label={e} className="text-text hover:scale-125 transition-transform cursor-pointer">{e}</button>
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="h-5 shrink-0 px-4 text-small opacity-50" style={{ color: ink }} aria-live="polite">
        {typingLabel}
      </div>

      <div className="shrink-0 p-3 relative" style={{ borderTop: `1px solid ${hairline}` }}>
        {/* Content-mention typeahead — anchored above the composer */}
        {mentionQuery !== null && mentionItems.length > 0 && (
          <div
            role="listbox"
            aria-label={t('mentionContent')}
            className="absolute bottom-full left-3 right-3 mb-1 max-h-48 overflow-y-auto rounded-lg shadow-lg dropdown-enter z-10"
            style={{ background: 'var(--project-white, var(--app-white))', transformOrigin: 'bottom left' }}
          >
            {mentionItems.map((item, i) => (
              <button
                key={`${item.module}-${item.docId}`}
                type="button"
                role="option"
                aria-selected={i === mentionIndex}
                onClick={() => selectMention(item)}
                onMouseEnter={() => setMentionIndex(i)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-small text-left cursor-pointer"
                style={{
                  color: ink,
                  background: i === mentionIndex ? 'color-mix(in srgb, ' + accent + ' 10%, transparent)' : 'transparent',
                }}
              >
                <MentionIcon module={item.module} className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </div>
        )}

        {pendingMentions.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {pendingMentions.map((m) => (
              <span key={`${m.module}-${m.docId}`} className="inline-flex items-center gap-1 text-small px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_10%,transparent)]" style={{ color: accent }}>
                <MentionIcon module={m.module} className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-40">{m.title}</span>
                <button
                  type="button"
                  onClick={() => setPendingMentions((prev) => prev.filter((x) => !(x.module === m.module && x.docId === m.docId)))}
                  aria-label={t('mentionRemove')}
                  className="cursor-pointer"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}

        {attachment && (
          <div className="flex items-center gap-2 mb-2 text-small opacity-70" style={{ color: ink }}>
            <Paperclip className="w-3.5 h-3.5" aria-hidden /> {t('attachmentAdded')}
            <button type="button" onClick={() => setAttachment(null)} aria-label={t('removeAttachment')} className="cursor-pointer">
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={t('attachImage')}
            className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_8%,transparent)]"
            style={{ color: ink }}
          >
            <Paperclip className="w-4 h-4" aria-hidden />
          </button>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); detectMention(e.target.value); sendTyping() }}
            onKeyDown={(e) => {
              const typeaheadOpen = mentionQuery !== null && mentionItems.length > 0
              if (typeaheadOpen) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => Math.min(i + 1, mentionItems.length - 1)); return }
                if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return }
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); selectMention(mentionItems[mentionIndex]); return }
                if (e.key === 'Escape') { e.stopPropagation(); setMentionQuery(null); setMentionItems([]); return }
              }
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            rows={1}
            aria-label={t('composerPlaceholder')}
            placeholder={t('composerPlaceholder')}
            className="flex-1 px-3 py-2 rounded-lg text-text outline-none resize-none shadow-sm transition-all duration-200 focus:shadow-md focus:ring-2 bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_5%,transparent)]"
            style={{ color: ink, '--tw-ring-color': accent } as React.CSSProperties}
          />
          <button
            type="button"
            onClick={send}
            disabled={pending || (!input.trim() && !attachment && pendingMentions.length === 0)}
            aria-label={t('send')}
            className="p-2 rounded-lg disabled:opacity-40 cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: accent, color: 'var(--project-white, var(--app-white))' }}
          >
            <Send className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
