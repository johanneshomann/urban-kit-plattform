// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface NotificationItem {
  id: string
  type: string
  title: string | null
  href: string | null
  read: boolean
  createdAt: string
}

const POLL_OPEN_MS = 10_000
const POLL_CLOSED_MS = 30_000

/**
 * Notifications for the launcher's second tab: list + unread count from
 * /api/notifications, same polling discipline as the chat overview (slower
 * closed, paused while hidden, stale responses dropped).
 */
export function useNotifications(open: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    const res = await fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
    if (id !== requestId.current || !res) return
    setItems(res.items ?? [])
    setUnread(res.unread ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => {
      if (!document.hidden) void refresh()
    }, open ? POLL_OPEN_MS : POLL_CLOSED_MS)
    return () => clearInterval(id)
  }, [open, refresh])

  /** Mark everything read (viewing the tab clears the badge). */
  const markAllRead = useCallback(async () => {
    if (unread === 0) return
    setUnread(0)
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => {})
  }, [unread])

  return { items, unread, loading, refresh, markAllRead }
}
