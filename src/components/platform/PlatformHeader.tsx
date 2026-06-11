'use client'

import Link from 'next/link'
import { UserCircle, Home, LogOut, Heart } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { NotificationBell } from './NotificationBell'
import type { NotificationItem } from './NotificationBell'

interface PlatformHeaderProps {
  locale: string
  cityName: string
  userName?: string | null
  notificationItems?: NotificationItem[]
}

export function PlatformHeader({ locale, cityName, userName, notificationItems = [] }: PlatformHeaderProps) {
  return (
    <header className="h-14 border-b bg-white sticky top-0 z-50 shadow-sm grid grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10">

      {/* Left — Logo → public site */}
      <Link
        href={`/${locale}`}
        className="font-bold text-text transition-colors"
        style={{ color: 'var(--plattform-ink)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--plattform-accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--plattform-ink)')}
      >
        <span className="font-normal" style={{ color: 'var(--plattform-ink-accent)' }}>Urban</span>
        <span style={{ color: 'var(--plattform)' }}>KIT</span>
        <span className="font-normal"> – {cityName}</span>
      </Link>

      {/* Center — Greeting */}
      <span className="flex items-center justify-center gap-1.5 text-text" style={{ color: 'var(--plattform-ink)' }}>
        {userName ? `Hey ${userName.split(' ')[0]}` : 'Hey, schön dass du da bist'}
        <Heart className="w-[0.9em] h-[0.9em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: 'var(--plattform)' }} />
      </span>

      {/* Right — Dashboard + Bell + Profile + Logout */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center transition-colors"
          style={{ color: 'var(--plattform-ink)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--plattform-accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--plattform-ink)')}
        >
          <Home className="text-text w-[1em] h-[1em] shrink-0" />
        </Link>
        <NotificationBell locale={locale} items={notificationItems} />
        <Link
          href={`/${locale}/dashboard/profil`}
          className="flex items-center transition-colors"
          style={{ color: 'var(--plattform-ink)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--plattform-accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--plattform-ink)')}
        >
          <UserCircle className="text-text w-[1em] h-[1em] shrink-0" />
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center transition-colors cursor-pointer"
            style={{ color: 'var(--plattform-ink)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--plattform-accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--plattform-ink)')}
          >
            <LogOut className="text-text w-[1em] h-[1em] shrink-0" />
          </button>
        </form>
      </div>

    </header>
  )
}
