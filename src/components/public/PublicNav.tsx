'use client'

import Link from 'next/link'
import { useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogIn, LogOut, UserCircle, UserPlus, ChevronRight, CircleChevronDown, Menu, X, Home, Folders, Flag, Mail, Info, Archive, Users, BookOpen, Circle, ExternalLink, FolderOpen, Handshake, Route, Scale, Layout } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BereichSwitcher } from '@/components/public/BereichSwitcher'
import { LanguageSwitcher } from '@/components/public/LanguageSwitcher'

interface PublicNavProps {
  locale: string
  cityName: string
  cityLogoUrl?: string | null
  isLoggedIn?: boolean
  userName?: string | null
}

const CLOSE_DURATION = 280


type SubLink = { href: string; label: string; external?: boolean; icon?: LucideIcon }
type NavItem = { href: string; label: string; icon: LucideIcon; hoverColor?: string; dotColor?: string; subLinks?: SubLink[] }

// `label` holds a translation key resolved via t() at render time.
const MENUS: Record<string, NavItem[]> = {
  allgemein: [
    { href: '/', label: 'home', icon: Home },
    { href: '/bereich/projekte-archiv/alle-projekte', label: 'allProjects', icon: Folders },
    { href: '/starten', label: 'start', icon: Flag },
    { href: '/kontakt', label: 'contact', icon: Mail },
  ],
  informationen: [
    { href: '/ueber-urbankit', label: 'aboutExplained', icon: Info },
    {
      href: '/bereich/projekte-archiv', label: 'areaProjects', icon: Archive,
      hoverColor: 'var(--projekte-dark)', dotColor: 'var(--projekte-dark)',
      subLinks: [
        { href: '/bereich/projekte-archiv/alle-projekte', label: 'allProjects', icon: FolderOpen },
      ],
    },
    {
      href: '/bereich/zusammenarbeit', label: 'areaCollab', icon: Users,
      hoverColor: 'var(--zusammenarbeit-dark)', dotColor: 'var(--zusammenarbeit-dark)',
      subLinks: [
        { href: '/bereich/zusammenarbeit/module', label: 'modules', icon: Layout },
      ],
    },
    {
      href: '/bereich/grundlagen', label: 'areaBasics', icon: BookOpen,
      hoverColor: 'var(--grundlagen-dark)', dotColor: 'var(--grundlagen-dark)',
      subLinks: [
        { href: 'https://methoden.urbankit.de', label: 'methods', external: true, icon: ExternalLink },
        { href: '/bereich/grundlagen/partizipation', label: 'participation', icon: Handshake },
        { href: '/bereich/grundlagen/projektplanung', label: 'projectPlanning', icon: Route },
        { href: '/bereich/grundlagen/recht', label: 'legalFramework', icon: Scale },
      ],
    },
  ],
}

type MenuKey = 'allgemein' | 'informationen'

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

export function PublicNav({ locale, cityName, isLoggedIn = false, userName }: PublicNavProps) {
  const l = `/${locale}`
  const t = useTranslations('publicNav')

  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null)
  const [desktopClosing, setDesktopClosing] = useState(false)
  const [dropdownLeft, setDropdownLeft] = useState(0)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const [mobileOpenAccordion, setMobileOpenAccordion] = useState<string | null>(null)
  const desktopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const desktopClose = useCallback(() => {
    if (desktopTimer.current) clearTimeout(desktopTimer.current)
    desktopTimer.current = setTimeout(() => {
      setDesktopClosing(true)
      desktopTimer.current = setTimeout(() => {
        setActiveMenu(null)
        setDesktopClosing(false)
        setOpenAccordion(null)
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

  const toggleDesktopAccordion = useCallback((href: string) => {
    setOpenAccordion(prev => prev === href ? null : href)
  }, [])

  const toggleMobileAccordion = useCallback((href: string) => {
    setMobileOpenAccordion(prev => prev === href ? null : href)
  }, [])

  const mobile = useAnimatedOpen(CLOSE_DURATION)

  const pathname = usePathname()
  const isActive = (href: string) => {
    if (href === '/') return pathname === l
    const full = `${l}${href}`
    return pathname === full || pathname.startsWith(full + '/')
  }

  const Logo = (
    <span className="inline-flex items-center gap-1.5">
      <span><span className="font-normal" style={{ color: 'var(--plattform-ink-accent)' }}>Urban</span><span style={{ color: 'var(--plattform)' }}>KIT</span></span>
      <span className="font-normal" style={{ color: 'var(--plattform-ink)' }}> – {cityName}</span>
    </span>
  )

  return (
    <>
      <header className={`h-14 border-b bg-white grid grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10 sticky top-0 z-50 transition-shadow ${mobile.isOpen ? '' : 'shadow-md'}`}>
        {/* Desktop triggers — left */}
        <div>
        <div className="hidden md:flex items-center gap-8">
          {(['allgemein', 'informationen'] as MenuKey[]).map((key) => {
            const active = activeMenu === key && !desktopClosing
            return (
              <button
                key={key}
                onClick={(e) => desktopOpen(key, e.currentTarget.getBoundingClientRect().left)}
                onMouseEnter={(e) => desktopOpen(key, e.currentTarget.getBoundingClientRect().left)}
                onMouseLeave={desktopClose}
                className={`flex items-center gap-1 text-text cursor-pointer transition-colors hover:text-[var(--plattform-accent)] ${active ? 'text-[var(--plattform)]' : 'text-[var(--plattform-ink)]'}`}
              >
                {t(`trigger${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
                <ChevronRight className={`text-text w-[1em] h-[1em] shrink-0 transition-transform duration-300 ${active ? 'rotate-90' : ''}`} />
              </button>
            )
          })}
        </div>
        </div>

        {/* Logo — centered */}
        <Link href={l} className="font-bold text-text">
          {Logo}
        </Link>

        {/* Right side */}
        <div className="flex justify-end items-center gap-4">
          {/* Desktop: language toggle */}
          <LanguageSwitcher className="hidden md:flex" />

          {/* Desktop: Anmelden / User */}
          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-3">
              <Link
                href={`${l}/dashboard`}
                className="flex items-center gap-1.5 text-text transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
              >
                <UserCircle className="w-[1.1em] h-[1.1em] shrink-0" />
                {userName ?? t('loggedIn')}
              </Link>
              <Link
                href={`${l}/dashboard`}
                className="flex items-center text-text transition-colors text-[var(--plattform-ink)] opacity-40 hover:opacity-100 hover:text-[var(--plattform-accent)]"
              >
                <LogOut className="w-[1em] h-[1em] shrink-0" />
              </Link>
            </div>
          ) : (
            <Link
              href={`${l}/login`}
              className="hidden md:flex items-center gap-1.5 text-text transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
            >
              {t('login')} <LogIn className="w-[1em] h-[1em] shrink-0" />
            </Link>
          )}

          {/* Mobile: user icon (when logged in) + burger */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn && (
              <Link
                href={`${l}/dashboard`}
                className="flex items-center gap-1 transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
              >
                <UserCircle className="w-5 h-5" />
              </Link>
            )}
            <button
              onClick={mobile.isOpen ? mobile.close : mobile.open}
              className="flex items-center cursor-pointer transition-colors text-[var(--plattform-ink)] hover:text-[var(--plattform-accent)]"
            >
              <span className="relative w-5 h-5 shrink-0">
                <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobile.isOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
                <X className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobile.isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
              </span>
            </button>
          </div>
        </div>

        {/* Desktop dropdown */}
        {activeMenu && (
          <div
            className="hidden md:block fixed top-14 overflow-hidden z-50 w-max rounded-b-xl"
            style={{ left: dropdownLeft }}
            onMouseEnter={desktopCancelClose}
            onMouseLeave={desktopClose}
          >
            <div key={activeMenu} className={`${desktopClosing ? 'nav-panel-exit' : 'nav-panel-enter'} bg-white border border-t-0 rounded-b-xl shadow-md`}>
              <div className="px-6 py-6 flex flex-col gap-1">
                {MENUS[activeMenu].map(({ href, label, icon: Icon, hoverColor, dotColor, subLinks }) => {
                  const active = isActive(href)
                  const activeColor = hoverColor ?? 'var(--plattform-ink-accent)'
                  return (
                  <div key={href}>
                    <div className="flex items-center justify-between gap-2 py-1.5">
                      <Link
                        href={`${l}${href}`}
                        onClick={desktopClose}
                        className={`flex items-center gap-2 text-text transition-colors ${active ? 'font-bold' : 'font-normal'}`}
                        style={{ color: active ? activeColor : 'var(--plattform-ink)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = hoverColor ?? 'var(--plattform)')}
                        onMouseLeave={e => (e.currentTarget.style.color = active ? activeColor : 'var(--plattform-ink)')}
                      >
                        {dotColor
                          ? <Circle className="text-text w-[1em] h-[1em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: dotColor }} />
                          : <Icon className="text-text w-[1em] h-[1em] shrink-0" />
                        }
                        {t(label)}
                      </Link>
                      {subLinks && (
                        <button
                          onClick={() => toggleDesktopAccordion(href)}
                          className="p-2 -mr-2 rounded transition-colors text-[var(--plattform-ink)]"
                          style={{ color: openAccordion === href ? (hoverColor ?? 'var(--plattform)') : undefined }}
                          onMouseEnter={e => (e.currentTarget.style.color = hoverColor ?? 'var(--plattform)')}
                          onMouseLeave={e => (e.currentTarget.style.color = openAccordion === href ? (hoverColor ?? 'var(--plattform)') : '')}
                        >
                          <CircleChevronDown className={`text-text w-[1em] h-[1em] shrink-0 transition-transform duration-200 ${openAccordion === href ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {subLinks && (
                      <div className={`grid transition-all duration-200 ease-in-out ${openAccordion === href ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <div className="pl-6 flex flex-col gap-0 pt-0.5 pb-1">
                            {subLinks.map((sub) => {
                              const SubIcon = sub.icon
                              const subActive = !sub.external && isActive(sub.href)
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.external ? sub.href : `${l}${sub.href}`}
                                  target={sub.external ? '_blank' : undefined}
                                  rel={sub.external ? 'noopener noreferrer' : undefined}
                                  onClick={desktopClose}
                                  className={`flex items-center gap-1.5 text-small py-0.5 transition-colors ${subActive ? 'font-bold' : 'font-normal'}`}
                                  style={{ color: subActive ? activeColor : 'var(--plattform-ink)' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = hoverColor ?? 'var(--plattform)')}
                                  onMouseLeave={e => (e.currentTarget.style.color = subActive ? activeColor : 'var(--plattform-ink)')}
                                >
                                  {SubIcon && <SubIcon className="text-small w-[1em] h-[1em] shrink-0" />}
                                  {t(sub.label)}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      <BereichSwitcher locale={locale} />

      {/* Mobile click-outside backdrop */}
      {mobile.active && (
        <div
          className="md:hidden fixed top-14 inset-x-0 bottom-0 z-30"
          onClick={mobile.close}
        />
      )}

      {/* Mobile overlay */}
      {mobile.active && (
        <div className={`md:hidden fixed top-14 inset-x-0 z-40 bg-white border-b shadow-md ${mobile.closing ? 'nav-panel-exit' : 'nav-panel-enter'}`}>
          <div className="px-6 py-4 flex flex-col gap-0">
            {/* Allgemein */}
            <div className="flex flex-col gap-0">
              {MENUS.allgemein.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={`${l}${href}`} onClick={mobile.close}
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

            {/* Informationen */}
            <div>
              <div className="flex flex-col gap-1">
                {MENUS.informationen.map(({ href, label, icon: Icon, dotColor, hoverColor, subLinks }) => {
                  const active = isActive(href)
                  const activeColor = hoverColor ?? 'var(--plattform-ink-accent)'
                  return (
                  <div key={href}>
                    <div className="flex items-center justify-between py-2">
                      <Link
                        href={`${l}${href}`}
                        onClick={mobile.close}
                        className={`flex items-center gap-2 text-text transition-colors ${active ? 'font-bold' : 'font-normal'}`}
                        style={{ color: active ? activeColor : 'var(--plattform-ink)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = hoverColor ?? 'var(--plattform)')}
                        onMouseLeave={e => (e.currentTarget.style.color = active ? activeColor : 'var(--plattform-ink)')}
                      >
                        {dotColor
                          ? <Circle className="text-text w-[1em] h-[1em] shrink-0" fill="currentColor" strokeWidth={0} style={{ color: dotColor }} />
                          : <Icon className="text-text w-[1em] h-[1em] shrink-0" />
                        }
                        {t(label)}
                      </Link>
                      {subLinks && (
                        <button
                          onClick={() => toggleMobileAccordion(href)}
                          className="p-2 -mr-2 rounded transition-colors text-[var(--plattform-ink)]"
                          style={{ color: mobileOpenAccordion === href ? (hoverColor ?? 'var(--plattform)') : undefined }}
                          onMouseEnter={e => (e.currentTarget.style.color = hoverColor ?? 'var(--plattform)')}
                          onMouseLeave={e => (e.currentTarget.style.color = mobileOpenAccordion === href ? (hoverColor ?? 'var(--plattform)') : '')}
                        >
                          <CircleChevronDown className={`text-text w-[1.2em] h-[1.2em] shrink-0 transition-transform duration-200 ${mobileOpenAccordion === href ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    {subLinks && (
                      <div className={`grid transition-all duration-200 ease-in-out ${mobileOpenAccordion === href ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <div className="pl-7 flex flex-col gap-0 pt-0.5 pb-1">
                            {subLinks.map((sub) => {
                              const SubIcon = sub.icon
                              const subActive = !sub.external && isActive(sub.href)
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.external ? sub.href : `${l}${sub.href}`}
                                  target={sub.external ? '_blank' : undefined}
                                  rel={sub.external ? 'noopener noreferrer' : undefined}
                                  onClick={mobile.close}
                                  className={`flex items-center gap-1.5 py-0.5 text-small transition-colors ${subActive ? 'font-bold' : 'font-normal'}`}
                                  style={{ color: subActive ? activeColor : 'var(--plattform-ink)' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = hoverColor ?? 'var(--plattform)')}
                                  onMouseLeave={e => (e.currentTarget.style.color = subActive ? activeColor : 'var(--plattform-ink)')}
                                >
                                  {SubIcon && <SubIcon className="text-small w-[1em] h-[1em] shrink-0" />}
                                  {t(sub.label)}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
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
                <Link
                  href={`${l}/dashboard`}
                  onClick={mobile.close}
                  className="flex-1 flex items-center justify-between px-5 py-3 rounded-lg text-cta font-normal text-white transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
                >
                  <span className="flex items-center gap-2">
                    <UserCircle className="w-[1em] h-[1em] shrink-0" />
                    {userName ?? t('loggedIn')}
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    href={`${l}/login`}
                    onClick={mobile.close}
                    className="flex-1 flex items-center justify-between px-5 py-3 rounded-lg text-cta font-normal text-white transition-colors bg-[var(--plattform)] hover:bg-[var(--plattform-accent)]"
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
        </div>
      )}
    </>
  )
}
