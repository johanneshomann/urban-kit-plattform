// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import Link from 'next/link'
import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, LogIn, LogOut, UserCircle, UserPlus, ChevronRight, Menu, X, Home, Folders, Flag, Mail, Info, Users, BookOpen, FolderOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LanguageSwitcher } from '@/components/public/LanguageSwitcher'
import { logoutPortalAction } from '@/actions/auth'
import { PROFILE_BADGE_ICONS, PROFILE_BADGE_VALUES, type ProfileBadge } from '@/lib/profile-badges'

interface PublicNavProps {
  locale: string
  cityName: string
  cityLogoUrl?: string | null
  isLoggedIn?: boolean
  userName?: string | null
  avatarUrl?: string | null
  profileBadge?: string | null
}

const CLOSE_DURATION = 280


type NavItem = { href: string; label: string; icon: LucideIcon; hoverColor?: string; iconColor?: string }

// `label` holds a translation key resolved via t() at render time. Bereich
// entries use the same icon as their page hero's ghost illustration, tinted in
// the Bereich's dark color.
const MENUS: Record<string, NavItem[]> = {
  allgemein: [
    { href: '/', label: 'home', icon: Home },
    { href: '/bereich/projekte-archiv/alle-projekte', label: 'allProjects', icon: Folders },
    { href: '/starten', label: 'start', icon: Flag },
    { href: '/ueber-urbankit', label: 'aboutExplained', icon: Info },
    { href: '/kontakt', label: 'contact', icon: Mail },
  ],
  bereiche: [
    {
      href: '/bereich/projekte-archiv', label: 'areaProjects', icon: FolderOpen,
      hoverColor: 'var(--projekte-accent)', iconColor: 'var(--projekte-accent)',
    },
    {
      href: '/bereich/zusammenarbeit', label: 'areaCollab', icon: Users,
      hoverColor: 'var(--zusammenarbeit-accent)', iconColor: 'var(--zusammenarbeit-accent)',
    },
    {
      href: '/bereich/grundlagen', label: 'areaBasics', icon: BookOpen,
      hoverColor: 'var(--grundlagen-accent)', iconColor: 'var(--grundlagen-accent)',
    },
  ],
}

type MenuKey = 'allgemein' | 'bereiche'

function useAnimatedOpen(duration: number) {
  const [active, setActive] = useState(false)
  const [closing, setClosing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => {
    setClosing(true)
    timer.current = setTimeout(() => {
      setActive(false)
      setClosing(false)
    }, duration)
  }, [duration])

  const open = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setClosing(false)
    setActive(true)
  }, [])

  return { active, closing, isOpen: active && !closing, open, close }
}

export function PublicNav({ locale, cityName, isLoggedIn = false, userName, avatarUrl, profileBadge }: PublicNavProps) {
  const l = `/${locale}`
  const t = useTranslations('publicNav')

  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null)
  const [desktopClosing, setDesktopClosing] = useState(false)
  const [dropdownLeft, setDropdownLeft] = useState(0)
  const desktopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const desktopClose = useCallback(() => {
    if (desktopTimer.current) clearTimeout(desktopTimer.current)
    desktopTimer.current = setTimeout(() => {
      setDesktopClosing(true)
      desktopTimer.current = setTimeout(() => {
        openSource.current = null
        setActiveMenu(null)
        setDesktopClosing(false)
      }, CLOSE_DURATION)
    }, 220)
  }, [])

  const desktopOpen = useCallback((menu: MenuKey, left: number) => {
    if (desktopTimer.current) clearTimeout(desktopTimer.current)
    setDropdownLeft(left)
    setDesktopClosing(false)
    setActiveMenu(menu)
  }, [])

  const desktopCancelClose = useCallback(() => {
    if (desktopTimer.current) clearTimeout(desktopTimer.current)
    setDesktopClosing(false)
  }, [])

  // How the open menu was opened. 'hover' menus close when the pointer leaves;
  // 'click' (incl. keyboard Enter) pins the menu until Escape, outside click,
  // focus-out or a second activation — otherwise incidental mouse position
  // closes the menu under a keyboard user mid-Tab.
  const openSource = useRef<'hover' | 'click' | null>(null)
  const desktopNavRef = useRef<HTMLElement | null>(null)

  const desktopCloseNow = useCallback(() => {
    if (desktopTimer.current) clearTimeout(desktopTimer.current)
    openSource.current = null
    setDesktopClosing(true)
    desktopTimer.current = setTimeout(() => {
      setActiveMenu(null)
      setDesktopClosing(false)
    }, CLOSE_DURATION)
  }, [])

  const desktopCloseIfHover = useCallback(() => {
    if (openSource.current === 'hover') desktopClose()
  }, [desktopClose])

  const mobile = useAnimatedOpen(CLOSE_DURATION)
  const dropdownId = useId()
  const mobilePanelId = useId()
  const triggerRefs = useRef<Partial<Record<MenuKey, HTMLButtonElement | null>>>({})
  const burgerRef = useRef<HTMLButtonElement>(null)

  // Escape closes whichever menu is open (WCAG 1.4.13 dismissable).
  const anyOpen = activeMenu !== null || mobile.active
  const mobileClose = mobile.close
  useEffect(() => {
    if (!anyOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (desktopTimer.current) clearTimeout(desktopTimer.current)
      openSource.current = null
      setActiveMenu((menu) => {
        if (menu) triggerRefs.current[menu]?.focus()
        return null
      })
      setDesktopClosing(false)
      mobileClose()
      burgerRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [anyOpen, mobileClose])

  // A pinned (click-opened) menu has no mouseleave close — dismiss it when
  // the pointer goes down anywhere outside the nav.
  useEffect(() => {
    if (activeMenu === null) return
    function onPointerDown(e: PointerEvent) {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target as Node)) {
        desktopCloseNow()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [activeMenu, desktopCloseNow])

  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === '/') return pathname === l
    const full = `${l}${href}`
    return pathname === full || pathname.startsWith(full + '/')
  }

  // User chip dropdown (logged-in) — same open/close animation as the menus,
  // and like them it opens on hover (with the 220ms grace close so the pointer
  // can cross into the panel) while a click pins it open.
  const userMenu = useAnimatedOpen(CLOSE_DURATION)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userOpenSource = useRef<'hover' | 'click' | null>(null)
  const userHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { active: userMenuActive, close: userMenuClose } = userMenu

  const userMenuCancelClose = () => {
    if (userHoverTimer.current) clearTimeout(userHoverTimer.current)
  }
  const userMenuCloseIfHover = () => {
    if (userOpenSource.current !== 'hover') return
    userMenuCancelClose()
    userHoverTimer.current = setTimeout(() => {
      userOpenSource.current = null
      userMenuClose()
    }, 220)
  }
  const userMenuHoverOpen = () => {
    if (userMenu.isOpen && userOpenSource.current === 'click') return
    userMenuCancelClose()
    userOpenSource.current = 'hover'
    userMenu.open()
  }

  useEffect(() => {
    if (!userMenuActive) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        userOpenSource.current = null
        userMenuClose()
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        userOpenSource.current = null
        userMenuClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [userMenuActive, userMenuClose])

  // Never leave a pending hover-close timer behind on unmount.
  useEffect(() => () => userMenuCancelClose(), [])

  const UserBadgeIcon =
    profileBadge && (PROFILE_BADGE_VALUES as readonly string[]).includes(profileBadge)
      ? PROFILE_BADGE_ICONS[profileBadge as ProfileBadge]
      : null

  /** Avatar circle (image or fallback icon) with the profile badge overlay. */
  const avatarChip = (size: 'sm' | 'md') => (
    <span className="relative shrink-0">
      <span
        className={`flex items-center justify-center rounded-full overflow-hidden ${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'}`}
        style={{ background: 'var(--plattform-light)' }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" aria-hidden className="h-full w-full object-cover" />
        ) : (
          <UserCircle aria-hidden className={size === 'sm' ? 'w-4.5 h-4.5' : 'w-5 h-5'} style={{ color: 'var(--plattform)' }} />
        )}
      </span>
      {UserBadgeIcon && (
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full shadow-sm"
          style={{ background: 'var(--plattform-accent)', color: 'var(--plattform-white)' }}
        >
          <UserBadgeIcon className="h-2 w-2" />
        </span>
      )}
    </span>
  )

  const Logo = (
    <span className="inline-flex items-center gap-1.5">
      <span><span className="font-normal" style={{ color: 'var(--plattform-ink-accent)' }}>Urban</span><span style={{ color: 'var(--plattform)' }}>KIT</span></span>
      <span className="font-normal" style={{ color: 'var(--plattform-ink)' }}> – {cityName}</span>
    </span>
  )

  return (
    <>
      <header className={`h-14 border-b bg-[var(--plattform-white)] grid grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10 sticky top-0 z-50 transition-shadow ${mobile.isOpen ? '' : 'shadow-md'}`}>
        {/* Desktop triggers — left. The dropdown lives right here in the DOM
            so keyboard focus moves trigger → menu links without detouring
            through logo and account controls (WCAG 2.4.3). The wrapper div
            keeps the grid cell on mobile, where the landmark itself is hidden
            so it doesn't duplicate the mobile panel's identically-named nav. */}
        <div>
        <nav ref={desktopNavRef} aria-label={t('mainNav')} className="hidden md:block">
        <div className="hidden md:flex items-center gap-8">
          {(['allgemein', 'bereiche'] as MenuKey[]).map((key) => {
            const active = activeMenu === key && !desktopClosing
            return (
              <button
                key={key}
                type="button"
                ref={(el) => { triggerRefs.current[key] = el }}
                aria-expanded={active}
                aria-controls={activeMenu === key ? dropdownId : undefined}
                onClick={(e) => {
                  if (activeMenu === key) {
                    if (openSource.current === 'click') desktopCloseNow()
                    else openSource.current = 'click'
                  } else {
                    openSource.current = 'click'
                    desktopOpen(key, e.currentTarget.getBoundingClientRect().left)
                  }
                }}
                onMouseEnter={(e) => {
                  if (activeMenu === key && openSource.current === 'click') return
                  openSource.current = 'hover'
                  desktopOpen(key, e.currentTarget.getBoundingClientRect().left)
                }}
                onMouseLeave={desktopCloseIfHover}
                className={`flex items-center gap-1 text-text cursor-pointer transition-colors hover:text-[var(--plattform-accent)] ${active ? 'text-[var(--plattform)]' : 'text-[var(--plattform-ink)]'}`}
              >
                {t(`trigger${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
                <ChevronRight aria-hidden className={`text-text w-[1em] h-[1em] shrink-0 transition-transform duration-300 ${active ? 'rotate-90' : ''}`} />
              </button>
            )
          })}
        </div>

        {/* Desktop dropdown */}
        {activeMenu && (
          <div
            id={dropdownId}
            inert={desktopClosing}
            className="hidden md:block fixed top-14 overflow-hidden z-50 w-max rounded-b-xl"
            style={{ left: dropdownLeft }}
            onMouseEnter={desktopCancelClose}
            onMouseLeave={desktopCloseIfHover}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) desktopClose()
            }}
          >
            <div key={activeMenu} className={`${desktopClosing ? 'nav-panel-exit' : 'nav-panel-enter'} bg-[var(--plattform-white)] border border-t-0 rounded-b-xl shadow-md`}>
              <div className="px-6 py-6 flex flex-col gap-1">
                {MENUS[activeMenu].map(({ href, label, icon: Icon, hoverColor, iconColor }) => {
                  const active = isActive(href)
                  const activeColor = hoverColor ?? 'var(--plattform-ink-accent)'
                  return (
                  <div key={href} className="flex items-center justify-between gap-2 py-1.5">
                    <Link
                      href={`${l}${href}`}
                      onClick={desktopClose}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2 text-text transition-colors ${active ? 'font-bold' : 'font-normal'}`}
                      style={{ color: active ? activeColor : 'var(--plattform-ink)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = hoverColor ?? 'var(--plattform)')}
                      onMouseLeave={e => (e.currentTarget.style.color = active ? activeColor : 'var(--plattform-ink)')}
                    >
                      <Icon aria-hidden className="text-text w-[1em] h-[1em] shrink-0" style={iconColor ? { color: iconColor } : undefined} />
                      {t(label)}
                    </Link>
                  </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        </nav>
        </div>

        {/* Logo — centered */}
        <Link href={l} className="font-bold text-text">
          {Logo}
        </Link>

        {/* Right side */}
        <div className="flex justify-end items-center gap-4">
          {/* Desktop: language toggle */}
          <LanguageSwitcher className="hidden md:flex" />

          {/* Divider between language switch and account controls */}
          <span
            aria-hidden="true"
            className="hidden md:block h-5 w-px shrink-0"
            style={{ background: 'color-mix(in srgb, var(--plattform-ink) 25%, transparent)' }}
          />

          {/* Desktop: Anmelden / User */}
          {isLoggedIn ? (
            /* App chip: avatar + name, opening a small user menu in the same
               style as the main-menu dropdowns. The app itself always opens in
               a new tab — it is its own area. */
            <div ref={userMenuRef} className="hidden md:block">
              <button
                type="button"
                onClick={() => {
                  if (userMenu.isOpen) {
                    if (userOpenSource.current === 'click') {
                      userOpenSource.current = null
                      userMenu.close()
                    } else {
                      userOpenSource.current = 'click'
                    }
                  } else {
                    userOpenSource.current = 'click'
                    userMenu.open()
                  }
                }}
                onMouseEnter={userMenuHoverOpen}
                onMouseLeave={userMenuCloseIfHover}
                aria-expanded={userMenu.active}
                aria-haspopup="menu"
                className="flex items-center gap-2 cursor-pointer text-text transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
              >
                {avatarChip('sm')}
                {userName ?? t('loggedIn')}
                <ChevronRight
                  aria-hidden
                  className={`text-text w-[1em] h-[1em] shrink-0 transition-transform duration-300 ${userMenu.active ? 'rotate-90' : ''}`}
                />
              </button>

              {userMenu.active && (
                <div
                  className="fixed top-14 right-6 md:right-10 overflow-hidden rounded-b-xl z-50 w-max"
                  onMouseEnter={userMenuCancelClose}
                  onMouseLeave={userMenuCloseIfHover}
                >
                  <div className={`${userMenu.closing ? 'nav-panel-exit' : 'nav-panel-enter'} bg-[var(--plattform-white)] border border-t-0 rounded-b-xl shadow-md`}>
                    <div className="px-6 py-6 flex flex-col gap-1" role="menu" aria-label={t('userMenu')}>
                      <a
                        href={`${l}/dashboard`}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        onClick={userMenu.close}
                        className="flex items-center gap-2 py-1.5 text-text transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform)]"
                      >
                        <LayoutDashboard aria-hidden className="text-text w-[1em] h-[1em] shrink-0" />
                        {t('userMenuDashboard')}
                      </a>
                      <a
                        href={`${l}/dashboard/profil`}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        onClick={userMenu.close}
                        className="flex items-center gap-2 py-1.5 text-text transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform)]"
                      >
                        <UserCircle aria-hidden className="text-text w-[1em] h-[1em] shrink-0" />
                        {t('userMenuProfile')}
                      </a>
                      <span aria-hidden className="h-px my-2" style={{ background: 'color-mix(in srgb, var(--plattform-ink) 15%, transparent)' }} />
                      <form action={logoutPortalAction} className="contents">
                        <button
                          type="submit"
                          role="menuitem"
                          className="flex items-center gap-2 py-1.5 text-text cursor-pointer transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
                        >
                          <LogOut aria-hidden className="text-text w-[1em] h-[1em] shrink-0" />
                          {t('logout')}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`${l}/login`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-text transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
            >
              {t('login')} <LogIn className="w-[1em] h-[1em] shrink-0" />
            </Link>
          )}

          {/* Mobile: user icon (when logged in) + burger */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn && (
              <a
                href={`${l}/dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('toDashboard')}
                className="flex items-center gap-1 transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
              >
                {avatarChip('sm')}
              </a>
            )}
            <button
              type="button"
              ref={burgerRef}
              onClick={mobile.isOpen ? mobile.close : mobile.open}
              aria-label={mobile.isOpen ? t('menuClose') : t('menu')}
              aria-expanded={mobile.isOpen}
              aria-controls={mobile.active ? mobilePanelId : undefined}
              className="flex items-center cursor-pointer transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
            >
              <span aria-hidden className="relative w-5 h-5 shrink-0">
                <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobile.isOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
                <X className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobile.isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
              </span>
            </button>
          </div>
        </div>

      </header>


      {/* Mobile click-outside backdrop */}
      {mobile.active && (
        <div
          aria-hidden="true"
          className="md:hidden fixed top-14 inset-x-0 bottom-0 z-30"
          onClick={mobile.close}
        />
      )}

      {/* Mobile overlay */}
      {mobile.active && (
        <nav
          id={mobilePanelId}
          aria-label={t('mainNav')}
          inert={mobile.closing}
          className={`md:hidden fixed top-14 inset-x-0 z-40 bg-[var(--plattform-white)] border-b shadow-md ${mobile.closing ? 'nav-panel-exit' : 'nav-panel-enter'}`}
        >
          <div className="px-6 py-4 flex flex-col gap-0">
            {/* Allgemein */}
            <div className="flex flex-col gap-0">
              {MENUS.allgemein.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={`${l}${href}`} onClick={mobile.close}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 py-2 text-text transition-colors ${active ? 'font-bold' : 'font-normal'}`}
                    style={{ color: active ? 'var(--plattform-ink-accent)' : 'var(--plattform-ink)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--plattform)')}
                    onMouseLeave={e => (e.currentTarget.style.color = active ? 'var(--plattform-ink-accent)' : 'var(--plattform-ink)')}
                  >
                    <Icon className="text-text w-[1em] h-[1em] shrink-0" />
                    {t(label)}
                  </Link>
                )
              })}
            </div>

            {/* Divider */}
            <div className="my-3 border-t" style={{ borderColor: 'var(--plattform-ink)', opacity: 0.15 }} />

            {/* Bereiche */}
            <div>
              <div className="flex flex-col gap-1">
                {MENUS.bereiche.map(({ href, label, icon: Icon, iconColor, hoverColor }) => {
                  const active = isActive(href)
                  const activeColor = hoverColor ?? 'var(--plattform-ink-accent)'
                  return (
                  <div key={href} className="flex items-center justify-between py-2">
                    <Link
                      href={`${l}${href}`}
                      onClick={mobile.close}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2 text-text transition-colors ${active ? 'font-bold' : 'font-normal'}`}
                      style={{ color: active ? activeColor : 'var(--plattform-ink)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = hoverColor ?? 'var(--plattform)')}
                      onMouseLeave={e => (e.currentTarget.style.color = active ? activeColor : 'var(--plattform-ink)')}
                    >
                      <Icon className="text-text w-[1em] h-[1em] shrink-0" style={iconColor ? { color: iconColor } : undefined} />
                      {t(label)}
                    </Link>
                  </div>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="my-3 border-t" style={{ borderColor: 'var(--plattform-ink)', opacity: 0.15 }} />

            {/* Language */}
            <div className="flex items-center justify-between py-2">
              <span className="text-text" style={{ color: 'var(--plattform-ink)' }}>Sprache / Language</span>
              <LanguageSwitcher className="px-2 font-bold" />
            </div>

            {/* Divider */}
            <div className="my-3 border-t" style={{ borderColor: 'var(--plattform-ink)', opacity: 0.15 }} />

            {/* Konto */}
            <div className="flex flex-row gap-3 pt-2 pb-2">
              {isLoggedIn ? (
                <>
                  <a
                    href={`${l}/dashboard`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={mobile.close}
                    className="flex-1 flex items-center justify-between px-5 py-3 rounded-lg text-cta font-normal text-[var(--plattform-white)] transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
                  >
                    <span className="flex items-center gap-2">
                      <UserCircle className="w-[1em] h-[1em] shrink-0" />
                      {userName ?? t('loggedIn')}
                    </span>
                  </a>
                  <form action={logoutPortalAction} className="flex-1 flex">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-between px-5 py-3 rounded-lg text-cta font-normal cursor-pointer transition-colors text-[var(--plattform-ink-accent)] bg-[var(--plattform-light)] hover:bg-[var(--plattform-accent)] hover:text-[var(--plattform-white)]"
                    >
                      {t('logout')} <LogOut className="text-text w-[1em] h-[1em] shrink-0" aria-hidden />
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href={`${l}/login`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={mobile.close}
                    className="flex-1 flex items-center justify-between px-5 py-3 rounded-lg text-cta font-normal text-[var(--plattform-white)] transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
                  >
                    {t('login')} <LogIn className="text-text w-[1em] h-[1em] shrink-0" />
                  </Link>
                  <Link
                    href={`${l}/register`}
                    onClick={mobile.close}
                    className="flex-1 flex items-center justify-between px-5 py-3 rounded-lg text-cta font-normal transition-colors text-[var(--plattform-ink-accent)]"
                    style={{ background: 'var(--plattform-light)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--plattform-accent)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--plattform-light)')}
                  >
                    {t('register')} <UserPlus className="text-text w-[1em] h-[1em] shrink-0" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
