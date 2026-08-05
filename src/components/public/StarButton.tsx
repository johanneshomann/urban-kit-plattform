'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { toggleProjectStar } from '@/actions/projects'

export function StarButton({ projectId, initialStarred }: { projectId: string; initialStarred: boolean }) {
  const [starred, setStarred] = useState(initialStarred)
  const [pending, setPending] = useState(false)

  const handleClick = () => {
    setPending(true)
    toggleProjectStar(projectId, starred)
      .then((res) => {
        if (!res.error) setStarred((v) => !v)
      })
      .finally(() => setPending(false))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={starred ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      className="p-2 rounded-lg border transition-colors disabled:opacity-40"
      style={{
        borderColor: starred ? 'var(--projekte-dark)' : 'color-mix(in srgb, var(--plattform) 30%, transparent)',
        color: starred ? 'var(--projekte-dark)' : 'var(--plattform)',
        fill: starred ? 'var(--projekte-dark)' : 'none',
      }}
    >
      <Star className="w-5 h-5" strokeWidth={starred ? 2 : 1.5} />
    </button>
  )
}