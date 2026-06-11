'use client'

import { createContext, useContext, useState } from 'react'

const BgContext = createContext<(color: string | null) => void>(() => {})

export function useDashboardBg() {
  return useContext(BgContext)
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [bg, setBg] = useState<string | null>(null)

  return (
    <BgContext.Provider value={setBg}>
      <div
        className="transition-colors duration-500"
        style={{ background: bg ?? 'transparent', minHeight: '100svh' }}
      >
        {children}
      </div>
    </BgContext.Provider>
  )
}
