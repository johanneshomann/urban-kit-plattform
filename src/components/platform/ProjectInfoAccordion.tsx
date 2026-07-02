'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Info, ChevronDown, Mail, Phone, Globe, User, type LucideIcon } from 'lucide-react'
import { ProjectGallerySlider } from '@/components/platform/ProjectGallerySlider'

interface GalleryImage {
  url: string
  alt?: string | null
  caption?: string | null
}

interface ContactInfo {
  email?: string | null
  telefon?: string | null
  website?: string | null
  ansprechperson?: string | null
}

interface DetailItem {
  label: string
  value: string
}

interface Props {
  beschreibungHtml?: string | null
  beteiligungsvorhabenHtml?: string | null
  details: DetailItem[]
  kontakt?: ContactInfo | null
  galleryImages: GalleryImage[]
  defaultOpen?: boolean
}

const P = {
  white:  'var(--project-white)',
  light:  'var(--project-light)',
  mid:    'var(--project-mid)',
  dark:   'var(--project-dark)',
} as const

export function ProjectInfoAccordion({
  beschreibungHtml,
  beteiligungsvorhabenHtml,
  details,
  kontakt,
  galleryImages,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const t = useTranslations('projectWorkspace')

  const hasContent =
    beschreibungHtml || beteiligungsvorhabenHtml || details.length > 0 ||
    (kontakt && (kontakt.email || kontakt.telefon || kontakt.website || kontakt.ansprechperson)) ||
    galleryImages.length >= 2

  if (!hasContent) return null

  return (
    <div
      style={{
        borderRadius: '0.75rem',
        border: `1.5px solid ${P.light}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        background: P.white,
        overflow: 'hidden',
      }}
    >
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.1rem 1.25rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              background: P.light,
              borderRadius: '0.5rem',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-display, 1rem)',
            }}
          >
            <Info style={{ width: '1em', height: '1em', color: P.mid }} />
          </div>
          <span style={{ fontSize: 'var(--text-display, 1rem)', fontWeight: 600, color: P.dark }}>
            {t('aboutProject')}
          </span>
        </div>
        <ChevronDown
          style={{
            width: '1.1rem',
            height: '1.1rem',
            color: P.mid,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Expandable body — grid-template-rows trick for smooth height animation */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              borderTop: `1.5px solid ${P.light}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              padding: '1.25rem',
            }}
          >

            {/* Beschreibung */}
            {beschreibungHtml && (
              <Section label={t('secDescription')}>
                <div
                  className="prose prose-sm max-w-none text-text"
                  style={{ color: P.dark }}
                  dangerouslySetInnerHTML={{ __html: beschreibungHtml }}
                />
              </Section>
            )}

            {/* Beteiligungsvorhaben */}
            {beteiligungsvorhabenHtml && (
              <Section label={t('secParticipation')}>
                <div
                  className="prose prose-sm max-w-none text-text"
                  style={{ color: P.dark }}
                  dangerouslySetInnerHTML={{ __html: beteiligungsvorhabenHtml }}
                />
              </Section>
            )}

            {/* Detail chips */}
            {details.length > 0 && (
              <Section label={t('secDetails')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {details.map((d) => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span className="text-text" style={{ color: P.mid, flexShrink: 0, minWidth: '7rem' }}>
                        {d.label}
                      </span>
                      <span className="text-text" style={{ color: P.dark }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Kontakt */}
            {kontakt && (kontakt.email || kontakt.telefon || kontakt.website || kontakt.ansprechperson) && (
              <Section label={t('secContact')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {kontakt.ansprechperson && (
                    <ContactRow icon={User} value={kontakt.ansprechperson} />
                  )}
                  {kontakt.email && (
                    <ContactRow icon={Mail} value={kontakt.email} href={`mailto:${kontakt.email}`} />
                  )}
                  {kontakt.telefon && (
                    <ContactRow icon={Phone} value={kontakt.telefon} href={`tel:${kontakt.telefon}`} />
                  )}
                  {kontakt.website && (
                    <ContactRow icon={Globe} value={kontakt.website} href={kontakt.website} external />
                  )}
                </div>
              </Section>
            )}

            {/* Gallery */}
            {galleryImages.length >= 2 && (
              <Section label={t('secGallery')}>
                <ProjectGallerySlider images={galleryImages} />
              </Section>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <p className="text-text" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--project-mid)', opacity: 0.7 }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function ContactRow({
  icon: Icon, value, href, external,
}: {
  icon: LucideIcon
  value: string
  href?: string
  external?: boolean
}) {
  const inner = (
    <div className="text-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Icon style={{ width: '1em', height: '1em', flexShrink: 0, color: 'var(--project-mid)' }} />
      <span style={{ color: 'var(--project-dark)' }}>{value}</span>
    </div>
  )
  if (!href) return inner
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{ textDecoration: 'none', opacity: 0.8 }}
    >
      {inner}
    </a>
  )
}
