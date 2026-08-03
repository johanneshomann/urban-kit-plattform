'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Horizontal card slider: a snap-scrolling track (hidden scrollbar) with
 * floating round prev/next buttons that fade out at the ends and page by
 * ~90% of the visible width. Slides come in as children — each child should
 * wrap itself in `snap-start shrink-0 basis-*` sizing.
 */
export function CardSlider({ children, locale = 'de' }: { children: ReactNode; locale?: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  function update() {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    update()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [children])

  function scroll(dir: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  const showNav = canPrev || canNext

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="no-scrollbar flex gap-6 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-2"
      >
        {children}
      </div>

      {showNav && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            aria-label={locale === 'de' ? 'Zurück' : 'Previous'}
            className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full shadow-md transition-opacity disabled:opacity-0 disabled:pointer-events-none cursor-pointer hover:scale-105"
            style={{ background: 'var(--plattform-white)', color: 'var(--plattform-ink-accent)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canNext}
            aria-label={locale === 'de' ? 'Weiter' : 'Next'}
            className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full shadow-md transition-opacity disabled:opacity-0 disabled:pointer-events-none cursor-pointer hover:scale-105"
            style={{ background: 'var(--plattform-white)', color: 'var(--plattform-ink-accent)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  )
}
