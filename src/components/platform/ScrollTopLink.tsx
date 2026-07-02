'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Link that smooth-scrolls to the top FIRST, then navigates — so the user
 * glides up to the persistent hero before the content fades to the new page.
 * Falls back to instant navigation when already at the top, when reduced
 * motion is requested, or for modified clicks (new tab etc.).
 */
export function ScrollTopLink({ href, className, style, children }: {
  href: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const router = useRouter()

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new-tab / download / context clicks
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()

    const reduceMotion =
      document.documentElement.classList.contains('a11y-reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || window.scrollY < 8) {
      router.push(href)
      return
    }

    let done = false
    const go = () => { if (!done) { done = true; router.push(href) } }
    // 'scrollend' fires when the smooth scroll settles; timeout covers browsers without it
    window.addEventListener('scrollend', go, { once: true })
    window.setTimeout(go, 700)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Link href={href} onClick={onClick} className={className} style={style}>
      {children}
    </Link>
  )
}
