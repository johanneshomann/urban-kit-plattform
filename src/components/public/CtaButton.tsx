import Link from 'next/link'
import { cloneElement, type ReactElement, type JSX } from 'react'

interface CtaButtonProps {
  href: string
  label: string
  icon: ReactElement<JSX.IntrinsicElements['svg']>
  variant?: 'plattform' | 'projekte' | 'projekteLight' | 'grundlagen' | 'grundlagenLight' | 'zusammenarbeit' | 'zusammenarbeitLight' | 'white'
  wide?: boolean
}

const variantClasses: Record<NonNullable<CtaButtonProps['variant']>, string> = {
  plattform: 'text-white bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]',
  projekte: 'bg-[var(--projekte)] hover:bg-[var(--projekte-dark)] text-[var(--projekte-on-brand)]',
  projekteLight: 'bg-[var(--projekte-light)] hover:bg-[var(--projekte-dark)] text-[var(--projekte-on-brand)]',
  grundlagen: 'bg-[var(--grundlagen)] hover:bg-[var(--grundlagen-dark)] text-[var(--grundlagen-on-brand)]',
  grundlagenLight: 'bg-[var(--grundlagen-light)] hover:bg-[var(--grundlagen-dark)] text-[var(--grundlagen-on-brand)]',
  zusammenarbeit: 'bg-[var(--zusammenarbeit)] hover:bg-[var(--zusammenarbeit-dark)] text-[var(--zusammenarbeit-on-brand)]',
  zusammenarbeitLight: 'bg-[var(--zusammenarbeit-light)] hover:bg-[var(--zusammenarbeit-dark)] text-[var(--zusammenarbeit-on-brand)]',
  white: 'bg-white hover:bg-gray-100 text-[var(--plattform-ink)]',
}

export function CtaButton({ href, label, icon, variant = 'plattform', wide = false }: CtaButtonProps) {
  const cls = `${wide ? 'flex justify-between' : 'inline-flex'} items-center gap-2 px-6 py-3 text-cta font-normal rounded-lg transition-colors ${variantClasses[variant]}`
  const content = (
    <>
      {label}
      {cloneElement(icon, { className: 'text-text w-[1em] h-[1em] shrink-0' })}
    </>
  )
  if (href.startsWith('http')) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>
  }
  return <Link href={href} className={cls}>{content}</Link>
}
