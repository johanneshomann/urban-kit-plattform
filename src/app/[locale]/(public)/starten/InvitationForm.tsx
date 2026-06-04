'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export function InvitationForm() {
  const [code, setCode] = useState('')

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="z. B. DET-UBUK-R8"
        className="flex-1 px-4 py-3 rounded-lg border text-text font-normal bg-white focus:outline-none focus:ring-2 focus:ring-[var(--plattform)]"
        style={{ color: 'var(--plattform-ink)' }}
      />
      <button
        className="px-5 py-3 rounded-lg text-cta font-normal text-white transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)] shrink-0"
      >
        Einlösen
      </button>
    </div>
  )
}
