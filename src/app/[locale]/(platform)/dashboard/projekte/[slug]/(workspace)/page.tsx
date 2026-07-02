import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Info, ArrowRight } from 'lucide-react'

import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { ModuleSection } from '@/components/platform/ModuleSection'
import { ProjectInfoAccordion } from '@/components/platform/ProjectInfoAccordion'
import { ProjectGallerySlider } from '@/components/platform/ProjectGallerySlider'
import { PARTICIPATE_MODULES, COLLABORATE_MODULES } from '@/lib/options/modules'
import { loadWorkspaceCards } from '@/lib/workspace-cards'
import { getWorkspaceContext } from '@/lib/workspace-context'

const P = {
  white:  'var(--project-white)',
  light:  'var(--project-light)',
  mid:    'var(--project-mid)',
  dark:   'var(--project-dark)',
  accent: 'var(--project-accent)',
} as const

// ─── page ─────────────────────────────────────────────────────────────────────
// The hero lives in the (workspace) layout — this page renders only the content.

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [tw, tax] = await Promise.all([
    getTranslations({ locale, namespace: 'projectWorkspace' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
  ])

  // Shared with the layout via React.cache — one fetch per request
  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()
  const { project, modules, membershipId, savedOrder, isActiveMember } = ctx

  const payload = await getPayload({ config })

  // Content previews for the module cards (both sections)
  const cardData = await loadWorkspaceCards(payload, project.id, modules)

  // Build ordered module list: use saved order if valid, otherwise use project module order
  const moduleOrder = savedOrder?.filter((id) => modules.includes(id)).length === modules.length
    ? savedOrder!
    : modules

  // Partition into the two workspace sections, preserving the user's saved order.
  // Chat is excluded from both (it becomes a floating pop-up, not a card).
  const participateItems = moduleOrder.filter((id) => (PARTICIPATE_MODULES as readonly string[]).includes(id))
  const collaborateItems = moduleOrder.filter((id) => (COLLABORATE_MODULES as readonly string[]).includes(id))

  const themaList = (project.thema ?? []).filter(Boolean)

  // richText → HTML
  const beschreibungHtml = project.projektbeschreibung
    ? convertLexicalToHTML({ data: project.projektbeschreibung as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null
  const beteiligungsvorhabenHtml = project.beteiligungsvorhaben
    ? convertLexicalToHTML({ data: project.beteiligungsvorhaben as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null

  // Plain-text teaser for the "Über das Projekt" strip
  const plainDescription = (beschreibungHtml ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const teaserText = plainDescription || project.shortDescription || ''

  const accordionDetails = [
    project.startYear ? { label: tw('detailYear'), value: String(project.startYear) } : null,
    (project.stadtbereich ?? []).length > 0
      ? { label: tw('detailStadtbereich'), value: (project.stadtbereich ?? []).map((v) => tax(`stadtbereich.${v}`)).join(', ') }
      : null,
    (project.altersgruppe ?? []).length > 0
      ? { label: tw('detailAltersgruppe'), value: (project.altersgruppe ?? []).map((v) => tax(`altersgruppe.${v}`)).join(', ') }
      : null,
    (project.gender ?? []).length > 0
      ? { label: tw('detailZielgruppe'), value: (project.gender ?? []).map((v) => tax(`gender.${v}`)).join(', ') }
      : null,
    project.isPublic != null
      ? { label: tw('detailPublic'), value: project.isPublic ? tw('valueYes') : tw('valueNo') }
      : null,
    project.joinRequestsEnabled != null
      ? { label: tw('detailRequests'), value: project.joinRequestsEnabled ? tw('requestsOn') : tw('requestsOff') }
      : null,
  ].filter((d): d is { label: string; value: string } => d !== null)

  const galleryImages = (project.gallery ?? [])
    .filter((g) => !!g.image?.url)
    .map((g) => ({ url: g.image!.url!, alt: g.image?.alt ?? null, caption: g.caption ?? null }))

  const ansprechperson = project.ansprechperson
    ? [project.ansprechperson.firstName, project.ansprechperson.lastName].filter(Boolean).join(' ') ||
      project.ansprechperson.email ||
      null
    : null

  return (
    <div
      className="p-6 md:p-8 flex flex-col gap-6"
      style={{
        background: P.light,
        minHeight: 'calc(100svh - 14rem)',
      }}
    >

      {/* Über das Projekt — teaser strip */}
      {teaserText && (
        <div className="rounded-xl p-5 flex items-start gap-4" style={{ background: P.white, border: `1.5px solid ${P.light}` }}>
          <div className="rounded-lg flex items-center justify-center shrink-0 p-2" style={{ background: P.light }}>
            <Info className="w-5 h-5" style={{ color: P.mid }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-display font-semibold mb-1" style={{ color: P.dark }}>{tw('aboutProject')}</p>
            <p className="text-small line-clamp-2" style={{ color: P.dark, opacity: 0.7 }}>{teaserText}</p>
          </div>
          <a href="#projektinfo" className="shrink-0 inline-flex items-center gap-1 text-small font-semibold mt-1" style={{ color: P.accent }}>
            {tw('teaserMore')} <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* thema tags */}
      {themaList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {themaList.map((th) => (
            <span
              key={th}
              className="text-small px-2.5 py-0.5 rounded-full"
              style={{ background: P.white, border: `1px solid color-mix(in srgb, ${P.mid} 20%, transparent)`, color: P.dark, opacity: 0.8 }}
            >
              {tax(`thema.${th}`)}
            </span>
          ))}
        </div>
      )}

      {/* Mitmachen — always present (news + calendar guaranteed) */}
      <ModuleSection
        title={tw('sectionParticipate')}
        items={participateItems}
        fullOrder={moduleOrder}
        membershipId={membershipId}
        projectSlug={slug}
        locale={locale}
        {...cardData}
      />

      {/* Zusammen arbeiten — only for active members, only if non-empty */}
      {isActiveMember && collaborateItems.length > 0 && (
        <ModuleSection
          title={tw('sectionCollaborate')}
          items={collaborateItems}
          fullOrder={moduleOrder}
          membershipId={membershipId}
          projectSlug={slug}
          locale={locale}
          {...cardData}
        />
      )}

      {/* ── Über das Projekt (full) + Bildergalerie ─────────────────────── */}
      <div id="projektinfo" className="grid gap-6 lg:grid-cols-2 pt-2 scroll-mt-6">
        <ProjectInfoAccordion
          beschreibungHtml={beschreibungHtml}
          beteiligungsvorhabenHtml={beteiligungsvorhabenHtml}
          details={accordionDetails}
          kontakt={{ ...project.kontakt, ansprechperson }}
          galleryImages={[]}
          defaultOpen
        />

        {galleryImages.length > 0 && (
          <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: P.white, border: `1.5px solid ${P.light}`, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <p className="text-display font-semibold" style={{ color: P.dark }}>{tw('secGallery')}</p>
            <ProjectGallerySlider images={galleryImages} />
          </div>
        )}
      </div>

    </div>
  )
}
