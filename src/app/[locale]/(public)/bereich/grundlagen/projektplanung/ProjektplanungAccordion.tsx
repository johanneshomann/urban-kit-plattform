'use client'

import { useState } from 'react'
import { ChevronDown, Circle } from 'lucide-react'

export interface TodoItem { bold: string; text: string }
export interface MethodItem { name: string; description: string }

export interface ProjektStep {
  phase: string
  title: string
  ziel: React.ReactNode
  intro: React.ReactNode
  todos: TodoItem[]
  wichtig: React.ReactNode
  methoden: MethodItem[]
}

function StepContent({ step }: { step: ProjektStep }) {
  return (
    <div className="space-y-8">
      {/* Title */}
      <h3 className="text-display font-black tracking-tight" style={{ color: 'var(--plattform-ink-accent)' }}>
        {step.title}<span style={{ color: 'var(--grundlagen-dark)' }}>.</span>
      </h3>

      {/* Ziel + Intro */}
      <div className="text-text space-y-2" style={{ color: 'var(--plattform-ink)' }}>{step.ziel}</div>
      <div className="text-text space-y-2" style={{ color: 'var(--plattform-ink)' }}>{step.intro}</div>

      {/* To Do */}
      <ul className="flex flex-col gap-2">
        {step.todos.map((todo, i) => (
          <li key={i} className="flex items-start gap-2 text-text" style={{ color: 'var(--plattform-ink)' }}>
            <Circle className="w-[0.55em] h-[0.55em] shrink-0 mt-[0.4em]" fill="currentColor" strokeWidth={0} style={{ color: 'var(--grundlagen-dark)' }} />
            <span><strong>{todo.bold}</strong>{todo.text ? ` — ${todo.text}` : ''}</span>
          </li>
        ))}
      </ul>

      {/* Wichtig — callout */}
      <blockquote
        className="border-l-4 pl-5 py-1 text-text"
        style={{ borderColor: 'var(--grundlagen)', color: 'var(--plattform-ink)' }}
      >
        {step.wichtig}
      </blockquote>

      {/* Methodenkiste */}
      <div>
        <p className="text-small uppercase tracking-widest font-black mb-3" style={{ color: 'var(--grundlagen-dark)' }}>
          Methodenkiste
        </p>
        <div className="flex flex-wrap gap-2">
          {step.methoden.map((m, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded-lg text-small"
              style={{ background: 'var(--plattform-white-transparent)' }}
            >
              <span className="font-black" style={{ color: 'var(--plattform-ink-accent)' }}>{m.name}</span>
              {m.description && <span className="opacity-60" style={{ color: 'var(--plattform-ink)' }}> · {m.description}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProjektplanungAccordion({ steps }: { steps: ProjektStep[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => {
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
                className="flex items-center justify-center w-[1.4em] h-[1.4em] rounded-full text-small font-black shrink-0"
                style={{
                  background: 'var(--grundlagen-dark)',
                  color: 'white',
                  filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.10)) drop-shadow(0 2px 4px rgba(0,0,0,0.10))' : 'none',
                  transition: 'filter 150ms',
                }}
              >
                {i}
              </span>
              <span className="flex-1 font-black tracking-tight transition-colors duration-200" style={{ color: isOpen ? 'var(--grundlagen-dark)' : 'var(--plattform-ink-accent)' }}>
                Schritt {i} · {step.phase}
              </span>
              <ChevronDown
                className={`w-[1em] h-[1em] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--grundlagen-dark)' }}
              />
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="pl-6 md:pl-14 pr-2 pt-4 pb-8">
                  <StepContent step={step} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
