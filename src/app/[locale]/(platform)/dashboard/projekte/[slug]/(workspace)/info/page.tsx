// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { ProjectInfoAccordion } from '@/components/platform/ProjectInfoAccordion'
import { ProjectGallerySlider } from '@/components/platform/ProjectGallerySlider'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { projectDefaults } from '@/lib/defaults/project'

const P = {
  white: 'var(--project-white)',
  light: 'var(--project-light)',
  accent: 'var(--project-accent)',
} as const

// „Über das Projekt" — description, details, contact and gallery on their own subpage.
export default async function ProjectInfoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const [tw, tax] = await Promise.all([
    getTranslations({ locale, namespace: 'projectWorkspace' }),
    getTranslations({ locale, namespace: 'taxonomy' }),
  ])

  const ctx = await getWorkspaceContext(slug)
  if (!ctx) notFound()
  const { project } = ctx

  // richText → HTML
  const beschreibungHtml = project.projektbeschreibung
    ? convertLexicalToHTML({ data: project.projektbeschreibung as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null
  const beteiligungsvorhabenHtml = project.beteiligungsvorhaben
    ? convertLexicalToHTML({ data: project.beteiligungsvorhaben as Parameters<typeof convertLexicalToHTML>[0]['data'] })
    : null

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
    <div className="flex-1" style={{ background: 'var(--project-light)' }}>
      <ProjectBreadcrumb
        items={[
          { label: tw('breadcrumbDashboard'), href: `/${locale}/dashboard/projekte/${slug}` },
          { label: tw('aboutProject') },
        ]}
      />
      <main className="p-6 md:p-8 w-full">
        {/* cover + short description — moved here from the old workspace hero */}
        <div className="mb-6">
          <img
            src={project.coverImage?.url ?? projectDefaults.coverImage}
            alt=""
            className="w-full rounded-xl object-cover"
            style={{ maxHeight: '18rem' }}
          />
          {project.shortDescription && (
            <p className="text-text mt-4 max-w-2xl" style={{ color: 'var(--project-ink)' }}>
              {project.shortDescription}
            </p>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-2 items-start">
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
              <p className="text-display font-semibold" style={{ color: P.accent }}>{tw('secGallery')}</p>
              <ProjectGallerySlider images={galleryImages} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
