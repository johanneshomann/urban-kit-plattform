'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider'

/**
 * Horizontal card slider: a snap-scrolling track (hidden scrollbar) with
 * floating round prev/next buttons that fade out at the ends and page by
 * ~90% of the visible width. Slides come in as children — each child should
 * wrap itself in `snap-start shrink-0 basis-*` sizing.
 *
 * `autoplay`: the track drifts slowly to the right, starting 500ms after the
 * slider enters the viewport. Any engagement (pointer, focus, wheel, touch,
 * nav buttons) hands control back to the user for good; the drift stops at
 * the end of the track and is disabled under reduced motion.
 */
export function CardSlider({ children, autoplay = false }: { children: ReactNode; autoplay?: boolean }) {
  const t = useTranslations('common')
  const { settings } = useAccessibility()
  // The drift is a JS animation — the CSS reduce-motion overrides can't reach
  // it (WCAG 2.2.2 / 2.3.3), so the preference disables autoplay entirely.
  const autoplayAllowed = autoplay && !settings.reduceMotion
  const trackRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const autoState = useRef({ running: false, stopped: !autoplay, pos: 0, raf: 0, delay: 0 as ReturnType<typeof setTimeout> | 0 })

  // Permanently stop the drift — the user has taken over.
  function stopAuto() {
    const a = autoState.current
    a.stopped = true
    a.running = false
    if (a.raf) cancelAnimationFrame(a.raf)
    if (a.delay) clearTimeout(a.delay)
  }

  useEffect(() => {
    if (!autoplayAllowed) return
    const root = rootRef.current
    const el = trackRef.current
    if (!root || !el) return
    const a = autoState.current

    const tick = () => {
      if (!a.running || a.stopped) return
      a.pos = Math.min(a.pos + 0.4, el.scrollWidth - el.clientWidth)
      el.scrollLeft = a.pos
      if (a.pos >= el.scrollWidth - el.clientWidth) { a.running = false; return }
      a.raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (a.stopped || a.running) return
      a.pos = el.scrollLeft
      a.running = true
      a.raf = requestAnimationFrame(tick)
    }
    const pause = () => {
      a.running = false
      if (a.raf) cancelAnimationFrame(a.raf)
    }

    // Begin 500ms after the slider scrolls into frame; pause while out of frame.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        a.delay = setTimeout(start, 500)
      } else {
        if (a.delay) clearTimeout(a.delay)
        pause()
      }
    }, { threshold: 0.3 })
    io.observe(root)

    // Any engagement stops the drift for good — pointer entering the region,
    // keyboard focus, wheel, touch or the arrow buttons. WCAG 2.2.2 wants a
    // stop mechanism in every modality; a resume-on-leave hover pause alone
    // isn't one.
    root.addEventListener('mouseenter', stopAuto)
    root.addEventListener('focusin', stopAuto)
    el.addEventListener('wheel', stopAuto, { passive: true })
    el.addEventListener('touchstart', stopAuto, { passive: true })

    return () => {
      io.disconnect()
      pause()
      if (a.delay) clearTimeout(a.delay)
      root.removeEventListener('mouseenter', stopAuto)
      root.removeEventListener('focusin', stopAuto)
      el.removeEventListener('wheel', stopAuto)
      el.removeEventListener('touchstart', stopAuto)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplayAllowed])

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
    stopAuto()
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: settings.reduceMotion ? 'auto' : 'smooth' })
  }

  const showNav = canPrev || canNext

  return (
    <div ref={rootRef} className="relative">
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
            aria-label={t('previous')}
            className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-1/2 z-10 flex items-center justify-center w-11 h-11 rounded-full shadow-md transition-opacity disabled:opacity-0 disabled:pointer-events-none cursor-pointer hover:scale-105"
            style={{ background: 'var(--plattform-white)', color: 'var(--plattform-ink-accent)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canNext}
            aria-label={t('next')}
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
