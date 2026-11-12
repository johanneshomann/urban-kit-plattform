// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, Crown, Settings2 } from 'lucide-react'
import { getUser } from '@/lib/auth/getUser'
import { MODULE_ICONS } from '@/components/platform/ProjectSidebar'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'help' })
  return { title: `${t('title')} – UrbanKIT` }
}

const MODULES = ['news', 'calendar', 'polls', 'forum', 'tasks', 'board', 'files', 'urban-agent'] as const
type SectionKey = 'start' | 'join' | 'work' | 'visibility' | 'tools' | 'profile' | 'lead' | 'manage'

/**
 * In-app help: the general usage of the platform in a few short sections
 * (texts in the `help` message namespace, bilingual). Role-aware — the
 * team-lead and project-lead sections only render for users who hold that
 * role in at least one project (admins see everything). Module blurbs carry
 * `#modul-<id>` anchors; the "?" in the project breadcrumb bar deep-links to
 * them (BreadcrumbHelpLink).
 */
export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, tModules, tp, user] = await Promise.all([
    getTranslations({ locale, namespace: 'help' }),
    getTranslations({ locale, namespace: 'modules' }),
    getTranslations({ locale, namespace: 'platform' }),
    getUser(),
  ])

  // Role flags across all of the viewer's active memberships.
  let isPM = false
  let isLead = false
  const isAdmin = (user as { role?: string } | null)?.role === 'admin'
  if (user) {
    const payload = await getPayload({ config })
    const mems = await payload.find({
      collection: 'project-memberships',
      where: { and: [{ user: { equals: user.id } }, { status: { equals: 'active' } }] },
      limit: 200, depth: 0, overrideAccess: true,
    })
    for (const m of mems.docs as { role?: string; leadOf?: string[] | null }[]) {
      if (m.role === 'PM') isPM = true
      if (Array.isArray(m.leadOf) && m.leadOf.length > 0) isLead = true
    }
  }

  const sections: { key: SectionKey; role?: boolean }[] = [
    { key: 'start' }, { key: 'join' }, { key: 'work' }, { key: 'visibility' }, { key: 'tools' }, { key: 'profile' },
    ...(isLead || isPM || isAdmin ? [{ key: 'lead' as const, role: true }] : []),
    ...(isPM || isAdmin ? [{ key: 'manage' as const, role: true }] : []),
  ]

  const card = { background: 'var(--app-white)', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }

  return (
    <div className="px-6 md:px-10 py-10 flex flex-col gap-8" style={{ color: 'var(--app-ink)' }}>
      <div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/dashboard`} className="inline-flex items-center opacity-50 transition-opacity hover:opacity-100">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            <span className="sr-only">{tp('navDashboard')}</span>
          </Link>
          <h1 className="text-small font-semibold opacity-50">{t('title')}</h1>
        </div>
        <div aria-hidden className="h-px mt-2" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        {/* Topic list — sticky on desktop */}
        <nav aria-label={t('toc')} className="lg:sticky lg:top-20 rounded-xl p-5" style={card}>
          <p className="text-small font-bold uppercase tracking-widest mb-3 opacity-60">{t('toc')}</p>
          <ul className="flex flex-col gap-1.5">
            {sections.map(({ key }) => (
              <li key={key}>
                <a href={`#${key}`} className="text-small transition-colors hover:underline" style={{ color: 'var(--app-ink-accent)' }}>
                  {t(`${key}.title`)}
                </a>
              </li>
            ))}
            <li><a href="#more" className="text-small transition-colors hover:underline" style={{ color: 'var(--app-ink-accent)' }}>{t('more.title')}</a></li>
          </ul>
        </nav>

        <div className="lg:col-span-3 flex flex-col gap-6 max-w-3xl">
          <p className="text-text">{t('intro')}</p>

          {sections.map(({ key, role }) => (
            <section key={key} id={key} className="rounded-xl p-6 md:p-8 scroll-mt-20" style={card}>
              <h2 className="flex items-center gap-2 text-display font-bold mb-2" style={{ color: 'var(--app-ink-accent)' }}>
                {key === 'lead' && <Crown aria-hidden className="w-5 h-5" />}
                {key === 'manage' && <Settings2 aria-hidden className="w-5 h-5" />}
                {t(`${key}.title`)}
              </h2>
              {role && <p className="text-small opacity-60 mb-2">{t('roleNote')}</p>}
              <p className="text-text leading-relaxed">{t(`${key}.body`)}</p>

              {key === 'work' ? (
                <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MODULES.map((m) => {
                    const Icon = MODULE_ICONS[m]
                    return (
                      <div key={m} id={`modul-${m}`} className="rounded-lg p-4 scroll-mt-20 target:ring-2" style={{ background: 'var(--app-light)', ['--tw-ring-color' as string]: 'var(--app-accent)' }}>
                        <dt className="flex items-center gap-2 text-text font-semibold" style={{ color: 'var(--app-ink-accent)' }}>
                          {Icon && <Icon aria-hidden className="w-4 h-4 shrink-0" />}
                          {tModules(m)}
                        </dt>
                        <dd className="text-small mt-1 leading-relaxed">{t(`work.modules.${m}`)}</dd>
                      </div>
                    )
                  })}
                </dl>
              ) : (
                <ol className="mt-4 flex flex-col gap-2 list-decimal pl-5 marker:font-semibold">
                  {(t.raw(`${key}.steps`) as string[]).map((s, i) => (
                    <li key={i} className="text-text leading-relaxed pl-1">{s}</li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          <section id="more" className="rounded-xl p-6 md:p-8 scroll-mt-20" style={card}>
            <h2 className="text-display font-bold mb-2" style={{ color: 'var(--app-ink-accent)' }}>{t('more.title')}</h2>
            <p className="text-text leading-relaxed">{t('more.body')}</p>
            <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
              <a href={`/${locale}/starten`} target="_blank" rel="noopener noreferrer" className="text-text underline" style={{ color: 'var(--app-accent)' }}>{t('more.linkStart')}</a>
              <a href={`/${locale}/kontakt`} target="_blank" rel="noopener noreferrer" className="text-text underline" style={{ color: 'var(--app-accent)' }}>{t('more.linkContact')}</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
