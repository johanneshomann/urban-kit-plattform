'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MyProject, OverviewRoom } from './types'

const POLL_OPEN_MS = 6_000
const POLL_CLOSED_MS = 25_000

/**
 * Single source of truth for the chat launcher: room list + unread badge from
 * /api/chat/overview. Polls slowly while the popup is closed, faster while it
 * is open, pauses entirely while the tab is hidden, and drops stale responses
 * via a request id. The project-room membership sync (?sync=1) runs once per
 * session, on the first open.
 */
export function useChatOverview(open: boolean) {
  const [rooms, setRooms] = useState<OverviewRoom[]>([])
  const [myProjects, setMyProjects] = useState<MyProject[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [canCreateGroups, setCanCreateGroups] = useState(false)
  const [loading, setLoading] = useState(true)
  const syncedRef = useRef(false)
  const requestId = useRef(0)

  const refresh = useCallback(async (opts: { sync?: boolean } = {}) => {
    const id = ++requestId.current
    const res = await fetch(`/api/chat/overview${opts.sync ? '?sync=1' : ''}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
    if (id !== requestId.current || !res) return
    setRooms(res.rooms ?? [])
    setMyProjects(res.myProjects ?? [])
    setTotalUnread(res.totalUnread ?? 0)
    setCanCreateGroups(res.canCreateGroups === true)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open && !syncedRef.current) {
      syncedRef.current = true
      void refresh({ sync: true })
    }
  }, [open, refresh])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => {
      if (!document.hidden) void refresh()
    }, open ? POLL_OPEN_MS : POLL_CLOSED_MS)
    return () => clearInterval(id)
  }, [open, refresh])

  return { rooms, myProjects, totalUnread, canCreateGroups, loading, refresh }
}
