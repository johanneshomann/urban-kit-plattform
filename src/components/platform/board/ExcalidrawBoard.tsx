// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import '@excalidraw/excalidraw/index.css'

// Excalidraw touches `window`; load client-only (the module namespace too —
// a static named import would pull the bundle into SSR).
const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, { ssr: false })

const CURSOR_COLORS = ['#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5', '#0c8599']
function colorFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return CURSOR_COLORS[h % CURSOR_COLORS.length]
}

type ExcalidrawModule = {
  reconcileElements: (local: any, remote: any, appState: any) => any[]
  CaptureUpdateAction: { NEVER: string }
}

/**
 * Real-time Excalidraw canvas backed by a Yjs document synced through the
 * Hocuspocus sidecar. Elements live in a Y.Map keyed by element id.
 *
 * Concurrency model (mirrors Excalidraw's own collab implementation):
 * - Incoming remote state is RECONCILED with the local scene via
 *   `reconcileElements` instead of replacing it — a full `updateScene`
 *   swap used to discard the other user's in-progress stroke on every
 *   remote delta, which is why simultaneous editing kept "eating" drawings.
 * - Remote applications use `captureUpdate: NEVER` so they don't pollute the
 *   local undo history.
 * - Writes win by version, tie-broken deterministically by the LOWER
 *   versionNonce (same rule Excalidraw uses), so two clients always converge
 *   instead of ping-ponging equal-version variants.
 * - Presence/cursors ride Yjs awareness.
 */
export function ExcalidrawBoard({ roomName, wsUrl, token, userId, userName }: {
  roomName: string; wsUrl: string; token: string; userId: string; userName: string
}) {
  const [api, setApi] = useState<any>(null)
  const [exc, setExc] = useState<ExcalidrawModule | null>(null)
  const providerRef = useRef<HocuspocusProvider | null>(null)
  const ydocRef = useRef<Y.Doc | null>(null)

  useEffect(() => {
    let alive = true
    import('@excalidraw/excalidraw').then((m) => {
      if (alive) setExc({ reconcileElements: (m as any).reconcileElements, CaptureUpdateAction: (m as any).CaptureUpdateAction })
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!api || !exc) return
    const ydoc = new Y.Doc()
    const provider = new HocuspocusProvider({ url: wsUrl, name: roomName, token, document: ydoc })
    ydocRef.current = ydoc
    providerRef.current = provider
    const yElements = ydoc.getMap<any>('elements')

    const applyRemote = () => {
      const remote = Array.from(yElements.values())
      const local = api.getSceneElementsIncludingDeleted()
      const reconciled = exc.reconcileElements(local, remote as any, api.getAppState())
      api.updateScene({ elements: reconciled, captureUpdate: exc.CaptureUpdateAction.NEVER })
    }

    const onChangeY = (_events: any, tx: Y.Transaction) => {
      if (tx.origin === 'local') return
      applyRemote()
    }
    yElements.observeDeep(onChangeY)

    const onSynced = () => applyRemote()
    provider.on('synced', onSynced)
    if (yElements.size > 0) applyRemote()

    // Presence (cursors)
    const awareness = provider.awareness
    const onAware = () => {
      if (!awareness) return
      const collaborators = new Map<string, any>()
      awareness.getStates().forEach((state: any, clientId: number) => {
        if (clientId === awareness.clientID) return
        const u = state.user ?? {}
        collaborators.set(String(clientId), {
          username: u.name,
          color: { background: u.color, stroke: u.color },
          pointer: state.pointer,
          button: state.button,
        })
      })
      api.updateScene({ collaborators })
    }
    if (awareness) {
      awareness.setLocalStateField('user', { name: userName, color: colorFor(userId) })
      awareness.on('change', onAware)
    }

    return () => {
      yElements.unobserveDeep(onChangeY)
      provider.off('synced', onSynced)
      if (awareness) awareness.off('change', onAware)
      provider.destroy()
      ydoc.destroy()
      providerRef.current = null
      ydocRef.current = null
    }
  }, [api, exc, roomName, wsUrl, token, userId, userName])

  const onChange = (elements: readonly any[]) => {
    const ydoc = ydocRef.current
    if (!ydoc) return
    const yElements = ydoc.getMap<any>('elements')
    ydoc.transact(() => {
      for (const el of elements) {
        const prev = yElements.get(el.id)
        const newer =
          !prev ||
          prev.version < el.version ||
          (prev.version === el.version && el.versionNonce < prev.versionNonce)
        if (newer) yElements.set(el.id, el)
      }
    }, 'local')
  }

  const onPointerUpdate = (payload: any) => {
    const aw = providerRef.current?.awareness
    if (!aw) return
    aw.setLocalStateField('pointer', payload.pointer)
    aw.setLocalStateField('button', payload.button)
  }

  return (
    <div className="h-full w-full">
      <Excalidraw excalidrawAPI={setApi} onChange={onChange} onPointerUpdate={onPointerUpdate} />
    </div>
  )
}
