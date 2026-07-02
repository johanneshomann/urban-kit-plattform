'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { UserCircle, LogOut, MessageSquare, User, ArrowLeft } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { NotificationBell } from './NotificationBell'
import type { NotificationItem } from './NotificationBell'

interface PlatformHeaderProps {
  locale: string
  cityName: string
  userName?: string | null
  notificationItems?: NotificationItem[]
}

// Chameleon colours: inside a project, ProjectThemeScope sets --project-* on
// <html>, so these resolve to the project scheme; elsewhere they fall back to
// the platform palette. The 500ms transition makes entering/leaving a project
// melt the header into (and out of) the project's world.
const INK = 'var(--project-dark, var(--plattform-ink))'
const ACCENT = 'var(--project-accent, var(--plattform-accent))'

const iconLink = 'flex items-center transition-colors'
const hoverAccent = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = ACCENT },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = INK },
}

/** Messages icon with polled unread badge (drives the /dashboard/nachrichten inbox). */
function HeaderMessagesLink({ locale }: { locale: string }) {
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    let alive = true
    const load = async () => {
      const res = await fetch('/api/chat/overview').then((r) => r.json()).catch(() => null)
      if (alive && res) setUnread(res.totalUnread ?? 0)
    }
    load()
    const id = setInterval(load, 20000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <Link href={`/${locale}/dashboard/nachrichten`} className={`${iconLink} relative`} style={{ color: INK }} {...hoverAccent}>
      <MessageSquare className="text-text w-[1em] h-[1em] shrink-0" />
      {unread > 0 && (
        <span
          className="absolute -top-1.5 -right-2 text-white rounded-full leading-none px-1 py-0.5 text-center"
          style={{ background: ACCENT, fontSize: '0.6rem', fontWeight: 700, minWidth: '1.1rem' }}
        >
          {unread}
        </span>
      )}
    </Link>
  )
}

/** Avatar dropdown: profile, public site, logout. */
function AvatarMenu({ locale }: { locale: string }) {
  const t = useTranslations('platform')
  const [open, setOpen] = useState(false)

  const item = 'flex items-center gap-2 px-3 py-2 text-small w-full text-left transition-colors hover:opacity-70'

  return (
    <div className="relative flex items-center">
      <button type="button" onClick={() => setOpen((v) => !v)} className={`${iconLink} cursor-pointer`} style={{ color: INK }} {...hoverAccent}>
        <UserCircle className="text-text w-[1em] h-[1em] shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-3 z-50 w-48 rounded-xl border shadow-lg py-1 transition-colors duration-500"
            style={{ background: 'var(--project-white, #ffffff)', borderColor: 'var(--project-light, #e5e7eb)', color: INK }}
          >
            <Link href={`/${locale}/dashboard/profil`} className={item} onClick={() => setOpen(false)}>
              <User className="w-4 h-4 opacity-60" /> {t('navMyProfile')}
            </Link>
            <Link href={`/${locale}`} className={item} onClick={() => setOpen(false)}>
              <ArrowLeft className="w-4 h-4 opacity-60" /> {t('navBack')}
            </Link>
            <form action={logoutAction}>
              <button type="submit" className={`${item} cursor-pointer`}>
                <LogOut className="w-4 h-4 opacity-60" /> {t('logout')}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export function PlatformHeader({ locale, cityName, notificationItems = [] }: PlatformHeaderProps) {
  return (
    <header
      className="h-14 border-b sticky top-0 z-50 shadow-sm flex items-center justify-between px-6 md:px-10 transition-colors duration-500"
      style={{ background: 'var(--project-white, #ffffff)', borderColor: 'var(--project-light, #e5e7eb)' }}
    >
      {/* Left — Logo → dashboard home */}
      <Link
        href={`/${locale}/dashboard`}
        className="font-bold text-text transition-colors"
        style={{ color: INK }}
        {...hoverAccent}
      >
        <span className="font-normal" style={{ color: 'var(--project-mid, var(--plattform-ink-accent))' }}>Urban</span>
        <span style={{ color: 'var(--project-accent, var(--plattform))' }}>KIT</span>
        <span className="font-normal"> – {cityName}</span>
      </Link>

      {/* Right — Messages + Bell + Avatar menu */}
      <div className="flex items-center justify-end gap-5">
        <HeaderMessagesLink locale={locale} />
        <NotificationBell locale={locale} items={notificationItems} />
        <AvatarMenu locale={locale} />
      </div>

    </header>
  )
}
