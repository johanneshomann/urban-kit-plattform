'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'

const base = 'flex items-center gap-2 px-3 py-2 rounded-lg text-small transition-colors w-full'
const POLL_MS = 15000

/** Sidebar link for the inbox that polls total unread and renders a badge. */
export function MessagesNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  const [hovered, setHovered] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const res = await fetch('/api/chat/overview').then((r) => r.json()).catch(() => null)
      if (alive && res) setUnread(res.totalUnread ?? 0)
    }
    load()
    const id = setInterval(load, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const bg = active ? 'var(--plattform)' : hovered ? 'var(--plattform-accent)' : 'transparent'
  const color = active || hovered ? 'var(--plattform-white)' : 'var(--plattform-ink)'

  return (
    <Link href={href} className={base} style={{ background: bg, color }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <MessageSquare className="w-4 h-4 shrink-0" />
      {label}
      {unread > 0 && (
        <span className="ml-auto text-small text-white rounded-full px-1.5 leading-5"
          style={{ background: active ? 'rgba(255,255,255,0.3)' : 'var(--plattform)' }}>
          {unread}
        </span>
      )}
    </Link>
  )
}
