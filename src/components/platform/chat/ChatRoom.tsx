'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Send, Paperclip, Smile, X } from 'lucide-react'
import type { MessageDTO } from './types'

const QUICK_EMOJI = ['👍', '❤️', '😄', '🎉', '🙏']
const POLL_MS = 3000

export function ChatRoom({ roomId, title }: { roomId: string; title: string }) {
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [typing, setTyping] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [attachment, setAttachment] = useState<{ id: string; url: string | null } | null>(null)
  const [reactingId, setReactingId] = useState<string | null>(null)
  const cursorRef = useRef<string | null>(null)
  const lastTypingSent = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const scrollDown = () => requestAnimationFrame(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  })

  const merge = useCallback((incoming: MessageDTO[]) => {
    if (incoming.length === 0) return
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]))
      for (const m of incoming) byId.set(m.id, m)
      const all = [...byId.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      cursorRef.current = all[all.length - 1]?.createdAt ?? cursorRef.current
      return all
    })
    scrollDown()
  }, [])

  // Reset + initial load when the room changes
  useEffect(() => {
    let active = true
    setMessages([]); setTyping([]); cursorRef.current = null
    ;(async () => {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`).then((r) => r.json()).catch(() => null)
      if (!active || !res) return
      merge(res.messages ?? [])
      setTyping(res.typing ?? [])
      fetch(`/api/chat/rooms/${roomId}/read`, { method: 'POST' }).catch(() => {})
    })()
    return () => { active = false }
  }, [roomId, merge])

  // Incremental poll
  useEffect(() => {
    const id = setInterval(async () => {
      const after = cursorRef.current ? `?after=${encodeURIComponent(cursorRef.current)}` : ''
      const res = await fetch(`/api/chat/rooms/${roomId}/messages${after}`).then((r) => r.json()).catch(() => null)
      if (!res) return
      merge(res.messages ?? [])
      setTyping(res.typing ?? [])
      if ((res.messages ?? []).length) fetch(`/api/chat/rooms/${roomId}/read`, { method: 'POST' }).catch(() => {})
    }, POLL_MS)
    return () => clearInterval(id)
  }, [roomId, merge])

  const sendTyping = () => {
    const now = Date.now()
    if (now - lastTypingSent.current < 2500) return
    lastTypingSent.current = now
    fetch(`/api/chat/rooms/${roomId}/typing`, { method: 'POST' }).catch(() => {})
  }

  const send = async () => {
    const content = input.trim()
    if ((!content && !attachment) || pending) return
    setPending(true)
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content, attachmentId: attachment?.id }),
      }).then((r) => r.json()).catch(() => null)
      if (res?.message) merge([res.message])
      setInput(''); setAttachment(null)
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

  return (
    <div className="flex flex-col h-full min-h-0">
      {title && (
        <div className="h-12 shrink-0 flex items-center px-4 border-b font-semibold text-text" style={{ color: 'var(--plattform-ink)' }}>
          {title}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.length === 0 && <p className="text-small text-gray-400 m-auto">Noch keine Nachrichten.</p>}
        {messages.map((m) => (
          <div key={m.id} className="group flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-small font-semibold" style={{ color: 'var(--plattform-ink)' }}>{m.author.name}</span>
              <span className="text-small text-gray-400">{new Date(m.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
              <button type="button" onClick={() => setReactingId(reactingId === m.id ? null : m.id)} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"><Smile className="w-3.5 h-3.5" /></button>
            </div>
            {m.content && <p className="text-text whitespace-pre-wrap" style={{ color: 'var(--plattform-ink)' }}>{m.content}</p>}
            {m.attachment?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.attachment.url} alt={m.attachment.filename ?? ''} className="max-w-xs rounded-lg border" />
            )}
            <div className="flex items-center gap-1 flex-wrap">
              {m.reactions.map((r) => (
                <button key={r.emoji} type="button" onClick={() => toggleReaction(m.id, r.emoji)}
                  className="text-small px-1.5 py-0.5 rounded-full border"
                  style={{ background: r.mine ? 'var(--plattform-light)' : 'transparent', borderColor: r.mine ? 'var(--plattform)' : '#e5e7eb' }}>
                  {r.emoji} {r.count}
                </button>
              ))}
              {reactingId === m.id && (
                <span className="flex items-center gap-1 px-1 rounded-full border bg-white">
                  {QUICK_EMOJI.map((e) => (
                    <button key={e} type="button" onClick={() => toggleReaction(m.id, e)} className="text-text hover:scale-125 transition-transform">{e}</button>
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="h-5 shrink-0 px-4 text-small text-gray-400">
        {typing.length > 0 && `${typing.join(', ')} ${typing.length === 1 ? 'tippt' : 'tippen'} …`}
      </div>

      <div className="shrink-0 border-t p-3">
        {attachment && (
          <div className="flex items-center gap-2 mb-2 text-small text-gray-600">
            <Paperclip className="w-3.5 h-3.5" /> Bild angehängt
            <button type="button" onClick={() => setAttachment(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
          <button type="button" onClick={() => fileRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-100" title="Bild anhängen">
            <Paperclip className="w-4 h-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); sendTyping() }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder="Nachricht schreiben …"
            className="flex-1 px-3 py-2 rounded-lg border text-text outline-none resize-none"
            style={{ borderColor: '#e5e7eb', color: 'var(--plattform-ink)' }}
          />
          <button type="button" onClick={send} disabled={pending || (!input.trim() && !attachment)}
            className="p-2 rounded-lg text-white disabled:opacity-40" style={{ background: 'var(--plattform)' }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
