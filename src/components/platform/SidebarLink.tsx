'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

const base = 'flex items-center gap-2 px-3 py-2 rounded-lg text-small transition-colors w-full'

interface SidebarLinkProps {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

export function SidebarLink({ href, label, icon: Icon, exact = false }: SidebarLinkProps) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  const [hovered, setHovered] = useState(false)

  const bg = active ? 'var(--plattform)' : hovered ? 'var(--plattform-accent)' : 'transparent'
  const color = active || hovered ? 'var(--plattform-white)' : 'var(--plattform-ink)'

  return (
    <Link
      href={href}
      className={base}
      style={{ background: bg, color }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )
}

interface SidebarButtonProps {
  label: string
  icon: LucideIcon
  action: () => Promise<void>
  plain?: boolean
}

export function SidebarButton({ label, icon: Icon, action, plain = false }: SidebarButtonProps) {
  const [hovered, setHovered] = useState(false)
  const bg = !plain && hovered ? 'var(--plattform-accent)' : 'transparent'
  const color = !plain && hovered ? 'var(--plattform-white)' : 'var(--plattform-ink)'
  return (
    <form action={action}>
      <button
        type="submit"
        className={`${base} cursor-pointer`}
        style={{ background: bg, color }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </button>
    </form>
  )
}
