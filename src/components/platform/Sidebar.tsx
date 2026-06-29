'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FolderKanban, User, MessageSquare, Settings, LogOut, ArrowLeft } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { SidebarLink, SidebarButton } from './SidebarLink'

interface SidebarProps {
  locale: string
  cityName: string
  userEmail: string
  userRole: string
  userName?: string | null
  userImageUrl?: string | null
}

export function Sidebar({ locale, cityName, userEmail, userRole, userName, userImageUrl }: SidebarProps) {
  const t = useTranslations('platform')
  const roleLabels: Record<string, string> = {
    admin: t('roleAdmin'),
    user: t('roleUser'),
  }
  return (
    <aside className="w-56 shrink-0 flex flex-col min-h-screen border-r bg-[var(--plattform-light)]">

      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b">
        <Link href={`/${locale}`} className="font-bold text-small flex items-center min-w-0 overflow-hidden">
          <span className="font-normal" style={{ color: 'var(--plattform-ink-accent)' }}>Urban</span>
          <span style={{ color: 'var(--plattform)' }}>KIT</span>
          <span className="font-normal truncate shrink min-w-0" style={{ color: 'var(--plattform-ink)' }}>&nbsp;– {cityName}</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5">
        <SidebarLink href={`/${locale}/dashboard`} label={t('navMyProjects')} icon={FolderKanban} exact />
        <SidebarLink href={`/${locale}/dashboard/nachrichten`} label={t('navMessages')} icon={MessageSquare} />
        <SidebarLink href={`/${locale}/dashboard/profil`} label={t('navMyProfile')} icon={User} />
      </nav>

      {/* Bottom */}
      <div className="border-t">
        {/* User info */}
        <div className="px-4 py-4 border-b flex flex-col items-start gap-3">
          {userImageUrl && (
            <img src={userImageUrl} alt={userName ?? userEmail} className="w-14 h-14 rounded-full object-cover" />
          )}
          <div className="w-full min-w-0">
            <p className="text-small font-normal opacity-50 mb-0.5">{roleLabels[userRole] ?? userRole}</p>
            <p className="text-small font-medium leading-snug truncate">{userName ?? userEmail}</p>
          </div>
        </div>

        {/* Links */}
        <div className="px-3 py-3 flex flex-col gap-1">
          <SidebarLink href={`/${locale}/dashboard/einstellungen`} label={t('navSettings')} icon={Settings} />
          <SidebarLink href={`/${locale}`} label={t('navBack')} icon={ArrowLeft} exact />
          <SidebarButton label={t('logout')} icon={LogOut} action={logoutAction} />
        </div>
      </div>

    </aside>
  )
}
