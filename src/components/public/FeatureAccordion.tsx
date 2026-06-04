'use client'

import { useState } from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'

export interface AccordionItem {
  icon: LucideIcon
  title: string
  body: string
}

interface Props {
  items: AccordionItem[]
  color: string
  hoverColor?: string
  cardBg?: string
  defaultOpen?: number[]
}

export function FeatureAccordion({ items, color, hoverColor, cardBg = 'white', defaultOpen = [0] }: Props) {
  const [open, setOpen] = useState<Set<number>>(new Set(defaultOpen))
  const [hovered, setHovered] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const accentFor = (i: number) => (hoverColor && hovered === i ? hoverColor : color)

  return (
    <div className="flex flex-col gap-4">
      {items.map((f, i) => {
        const isOpen = open.has(i)
        const Icon = f.icon
        const accent = accentFor(i)
        return (
          <div
            key={f.title}
            className="rounded-xl border transition-all hover:shadow-md cursor-pointer"
            style={{ background: cardBg }}
            onClick={() => toggle(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-full flex items-center gap-4 p-6">
              <div
                className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                style={{ background: accent, color: 'white' }}
              >
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <p className="flex-1 text-text font-semibold transition-colors" style={{ color: accent }}>{f.title}</p>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-all duration-300 ${isOpen ? 'rotate-90' : ''}`}
                style={{ color: accent }}
              />
            </div>
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="text-small leading-relaxed px-6 pb-6" style={{ color: 'var(--plattform-ink)' }}>{f.body}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
