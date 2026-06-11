import Link from 'next/link'
import { cloneElement, type ReactElement, type JSX } from 'react'

interface CtaButtonProps {
  href: string
  label: string
  icon: ReactElement<JSX.IntrinsicElements['svg']>
  variant?: 'plattform' | 'projekte' | 'grundlagen' | 'zusammenarbeit' | 'white'
  wide?: boolean
  newTab?: boolean
}

const variantClasses: Record<NonNullable<CtaButtonProps['variant']>, string> = {
  plattform: 'text-white bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]',
  projekte: 'bg-[var(--projekte)] hover:bg-[var(--projekte-dark)] text-[var(--plattform-ink)]',
  grundlagen: 'bg-[var(--grundlagen)] hover:bg-[var(--grundlagen-dark)] text-[var(--plattform-ink)]',
  zusammenarbeit: 'bg-[var(--zusammenarbeit)] hover:bg-[var(--zusammenarbeit-dark)] text-[var(--plattform-ink)]',
  white: 'bg-white hover:bg-gray-100 text-[var(--plattform-ink)]',
}

export function CtaButton({ href, label, icon, variant = 'plattform', wide = false, newTab = false }: CtaButtonProps) {
  const cls = `${wide ? 'flex justify-between' : 'inline-flex'} items-center gap-2 px-6 py-3 text-cta font-normal rounded-lg transition-colors ${variantClasses[variant]}`
  const content = (
    <>
      {label}
      {cloneElement(icon, { className: 'text-text w-[1em] h-[1em] shrink-0' })}
    </>
  )
  if (href.startsWith('http') || newTab) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>
  }
  return <Link href={href} className={cls}>{content}</Link>
}
