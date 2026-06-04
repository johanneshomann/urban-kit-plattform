'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Section {
  title: string
  content: React.ReactNode
}

export function PartizipationAccordion({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {sections.map((section, i) => {
        const isOpen = open === i
        const isHovered = hovered === i
        return (
          <div key={i} className="rounded-xl border overflow-hidden" style={{ background: 'var(--plattform-white-transparent)' }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="w-full flex items-center gap-2 md:gap-4 px-2 md:px-4 py-3 md:py-5 text-left cursor-pointer text-[1.05rem] md:text-display rounded-lg transition-colors duration-150"
              style={{ background: isHovered || isOpen ? 'color-mix(in srgb, var(--grundlagen-light) 50%, var(--grundlagen) 50%)' : 'transparent' }}
            >
              <span
                className="flex items-center justify-center w-[1.4em] h-[1.4em] rounded-full text-small font-black shrink-0 transition-colors duration-200"
                style={{
                  background: 'var(--grundlagen-dark)',
                  color: 'white',
                  filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.10)) drop-shadow(0 2px 4px rgba(0,0,0,0.10))' : 'none',
                  transition: 'filter 150ms',
                }}
              >
                {i + 1}
              </span>
              <span
                className="flex-1 font-black tracking-tight transition-colors duration-200"
                style={{ color: isOpen ? 'var(--grundlagen-dark)' : 'var(--plattform-ink-accent)' }}
              >
                {section.title}
              </span>
              <ChevronDown
                className={`w-[1em] h-[1em] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--grundlagen-dark)' }}
              />
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="pl-6 md:pl-14 pr-2 pt-2 pb-7 text-text space-y-4" style={{ color: 'var(--plattform-ink)' }}>
                  {section.content}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
