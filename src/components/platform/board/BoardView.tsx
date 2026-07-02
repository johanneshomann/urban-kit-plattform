'use client'

import { useState } from 'react'
import { Kanban } from 'lucide-react'
import { ExcalidrawBoard } from './ExcalidrawBoard'

export interface BoardRef {
  id: string
  name: string
}

export function BoardView({ boards, projectSlug, wsUrl, token, userId, userName }: {
  boards: BoardRef[]
  projectSlug: string
  wsUrl: string
  token: string
  userId: string
  userName: string
}) {
  const [selected, setSelected] = useState<string | null>(boards[0]?.id ?? null)

  if (boards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
        <Kanban className="w-8 h-8" />
        <p className="text-small">Für dieses Projekt wurde noch kein Board angelegt.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 border rounded-xl overflow-hidden bg-white" style={{ borderColor: '#e5e7eb' }}>
      {boards.length > 1 && (
        <div className="shrink-0 flex gap-1 px-2 py-1.5 border-b overflow-x-auto" style={{ borderColor: '#e5e7eb' }}>
          {boards.map((b) => (
            <button key={b.id} type="button" onClick={() => setSelected(b.id)}
              className="px-3 py-1.5 rounded-lg text-small font-medium whitespace-nowrap"
              style={{
                background: b.id === selected ? 'var(--plattform)' : 'transparent',
                color: b.id === selected ? '#fff' : 'var(--plattform-ink)',
              }}>
              {b.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 min-h-0">
        {selected && (
          <ExcalidrawBoard
            key={selected}
            roomName={`board:${projectSlug}:${selected}`}
            wsUrl={wsUrl}
            token={token}
            userId={userId}
            userName={userName}
          />
        )}
      </div>
    </div>
  )
}
