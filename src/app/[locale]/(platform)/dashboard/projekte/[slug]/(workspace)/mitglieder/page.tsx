// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { Crown, Shield, Users } from 'lucide-react'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { getWorkspaceContext } from '@/lib/workspace-context'

const personName = (u: unknown): string => {
  if (!u || typeof u !== 'object') return 'Unbekannt'
  const o = u as { firstName?: string; lastName?: string; email?: string }
  return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
}

/**
 * Workspace member list — visible to ACTIVE members only (names stay inside
 * the project, same audience that already sees them in chat mentions and
 * task assignments). Shows role, teams and team-lead badges; management
 * stays in manage/mitglieder (PM) and the team page (leads).
 */
export default async function ProjectMembersPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const ctx = await getWorkspaceContext(slug)
  if (!ctx || !ctx.isActiveMember) notFound()
  const { project } = ctx

  const payload = await getPayload({ config })
  const membersRes = await payload.find({
    collection: 'project-memberships',
    where: { and: [{ project: { equals: project.id } }, { status: { equals: 'active' } }] },
    depth: 1,
    limit: 500,
    overrideAccess: true,
  })

  const members = membersRes.docs
    .map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mm = m as any
      return {
        id: String(mm.id),
        name: personName(mm.user),
        isPM: mm.role === 'PM',
        teams: (Array.isArray(mm.teams) ? mm.teams : []) as string[],
        leadOf: (Array.isArray(mm.leadOf) ? mm.leadOf : []) as string[],
      }
    })
    .sort((a, b) => Number(b.isPM) - Number(a.isPM) || a.name.localeCompare(b.name, 'de'))

  return (
    <div className="flex-1 min-w-0 flex flex-col" style={{ background: 'var(--project-light)' }}>
      <ProjectBreadcrumb
        items={[
          { label: project.title, href: `/${locale}/dashboard/projekte/${slug}` },
          { label: 'Mitglieder' },
        ]}
      />
      {/* White content card under the light breadcrumb band — same pattern as manage */}
      <main className="card-in flex-1 mt-5 p-6 md:p-10 w-full min-w-0" style={{ background: 'var(--project-white)' }}>
        {/* Visually redundant with the breadcrumb — kept for screen readers (BITV). */}
        <h1 className="sr-only">Mitglieder</h1>

        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border py-12" style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}>
            <Users className="w-8 h-8" style={{ color: 'var(--project-ink)' }} />
            <p className="text-text" style={{ color: 'var(--project-ink)' }}>Noch keine Mitglieder.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ background: 'var(--project-white)', borderColor: 'color-mix(in srgb, var(--project-general) 20%, transparent)' }}
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-small font-bold"
                  style={{ background: 'var(--project-general)', color: 'var(--project-black)' }}
                >
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-text font-medium truncate" style={{ color: 'var(--project-accent)' }}>{m.name}</p>
                  {(m.teams.length > 0 || m.isPM) && (
                    <p className="flex flex-wrap items-center gap-1.5 mt-1">
                      {m.isPM && (
                        <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--project-accent)', color: 'var(--project-white)' }}>
                          <Shield className="w-3 h-3" aria-hidden /> Projektleitung
                        </span>
                      )}
                      {m.teams.map((t) => {
                        const lead = m.leadOf.includes(t)
                        return (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: lead ? 'var(--project-dark)' : 'var(--project-light)', color: lead ? 'var(--project-black)' : 'var(--project-ink)' }}
                            title={lead ? `Teamleitung ${t}` : t}
                          >
                            {lead && <Crown className="w-3 h-3" aria-hidden />}
                            {t}
                          </span>
                        )
                      })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
