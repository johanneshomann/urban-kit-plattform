// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { TeamRosterManager, type TeamRoster } from '@/components/platform/team/TeamRosterManager'

const personName = (u: unknown): string => {
  if (!u || typeof u !== 'object') return 'Unbekannt'
  const o = u as { firstName?: string; lastName?: string; email?: string }
  return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
}

/**
 * Team-lead workspace page (NOT under manage): every team the viewer leads
 * gets a roster section with add/remove. Server actions re-check leadership.
 */
export default async function TeamLeadPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getWorkspaceContext(slug)
  if (!ctx || ctx.viewer.leadOf.length === 0) notFound()
  const { project } = ctx

  const payload = await getPayload({ config })
  const membersRes = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ project: { equals: project.id } }, { status: { equals: 'active' } }] },
    depth: 1,
    limit: 500,
    overrideAccess: true,
  })

  const members = membersRes.docs.map((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mm = m as any
    return {
      membershipId: String(mm.id),
      name: personName(mm.user),
      teams: (Array.isArray(mm.teams) ? mm.teams : []) as string[],
      leadOf: (Array.isArray(mm.leadOf) ? mm.leadOf : []) as string[],
    }
  })

  const teams: TeamRoster[] = ctx.viewer.leadOf.map((team) => ({
    team,
    roster: members
      .filter((m) => m.teams.includes(team) || m.leadOf.includes(team))
      .map((m) => ({ membershipId: m.membershipId, name: m.name, isLead: m.leadOf.includes(team) }))
      .sort((a, b) => Number(b.isLead) - Number(a.isLead) || a.name.localeCompare(b.name, 'de')),
    candidates: members
      .filter((m) => !m.teams.includes(team) && !m.leadOf.includes(team))
      .map((m) => ({ membershipId: m.membershipId, name: m.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de')),
  }))

  return (
    <div className="flex-1 min-w-0 flex flex-col" style={{ background: 'var(--project-light)' }}>
      <ProjectBreadcrumb
        items={[
          { label: project.title, href: `/${locale}/dashboard/projekte/${slug}` },
          { label: 'Team' },
        ]}
      />
      {/* White content card under the light breadcrumb band — same pattern as manage */}
      <main className="card-in flex-1 mt-5 p-6 md:p-10 w-full min-w-0" style={{ background: 'var(--project-white)' }}>
        {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
        <h1 className="sr-only">Team</h1>
        <p className="text-text mb-6" style={{ color: 'var(--project-ink)' }}>
          Sie leiten {ctx.viewer.leadOf.length === 1 ? 'das Team' : 'die Teams'} {ctx.viewer.leadOf.join(', ')}. Hier nehmen Sie Projektmitglieder ins Team auf oder entfernen sie wieder — teambezogene Inhalte erstellen Sie direkt in den jeweiligen Modulen.
        </p>
        <TeamRosterManager slug={slug} locale={locale} teams={teams} viewerIsPM={ctx.viewer.isPM} />
      </main>
    </div>
  )
}
