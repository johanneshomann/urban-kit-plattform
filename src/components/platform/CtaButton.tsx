// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

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
  plattform: 'text-[var(--app-white)] bg-[var(--app-accent)] hover:bg-[var(--app-ink-accent)]',
  projekte: 'bg-[var(--projekte)] hover:bg-[var(--projekte-dark)] text-[var(--app-ink)]',
  grundlagen: 'bg-[var(--grundlagen)] hover:bg-[var(--grundlagen-dark)] text-[var(--app-ink)]',
  zusammenarbeit: 'bg-[var(--zusammenarbeit)] hover:bg-[var(--zusammenarbeit-dark)] text-[var(--app-ink)]',
  white: 'bg-[var(--app-white)] hover:bg-[var(--app-light)] text-[var(--app-ink)]',
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
