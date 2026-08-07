/**
 * Animated window scroll to an element's top with a controllable duration —
 * `scrollIntoView({ behavior: 'smooth' })` offers no speed control, so section
 * navigations that want a calmer pace use this rAF/ease version instead.
 * Respects the element's `scroll-margin-top`, resolves once the scroll is
 * done, and jumps instantly under reduced motion (system preference or the
 * a11y toggle).
 */
export function scrollToSection(el: HTMLElement, duration = 700): Promise<void> {
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop || '0') || 0
  const targetY = window.scrollY + el.getBoundingClientRect().top - margin

  const reduceMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('a11y-reduce-motion')
  if (reduceMotion) {
    window.scrollTo(0, targetY)
    return Promise.resolve()
  }

  const startY = window.scrollY
  const dist = targetY - startY
  if (Math.abs(dist) < 2) return Promise.resolve()

  return new Promise((resolve) => {
    const start = performance.now()
    const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      window.scrollTo(0, startY + dist * easeInOut(t))
      if (t < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}
