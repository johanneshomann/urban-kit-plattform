// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { lexicalToMarkdown } from '@/lib/richtext'
import { getUser } from '@/lib/auth/getUser'
import { ProjectBreadcrumb } from '@/components/platform/ProjectBreadcrumb'
import { getWorkspaceContext } from '@/lib/workspace-context'
import { TeamRosterManager, type TeamRoster } from '@/components/platform/team/TeamRosterManager'
import { TeamQuickActions } from '@/components/platform/team/TeamQuickActions'
import { CalendarManager, type EventItem } from '@/components/platform/manage/CalendarManager'
import { PollsManager, type PollItem } from '@/components/platform/manage/PollsManager'
import { FilesManager, type FolderItem, type FileItem } from '@/components/platform/manage/FilesManager'

const relId = (v: unknown): string | null => (v == null ? null : typeof v === 'object' ? String((v as { id: unknown }).id) : String(v))
const personName = (u: unknown): string => {
  if (!u || typeof u !== 'object') return 'Unbekannt'
  const o = u as { firstName?: string; lastName?: string; email?: string }
  return [o.firstName, o.lastName].filter(Boolean).join(' ').trim() || o.email || 'Unbekannt'
}

const TABS = [
  { key: 'team', label: 'Team' },
  { key: 'termine', label: 'Termine' },
  { key: 'umfragen', label: 'Umfragen' },
  { key: 'dateien', label: 'Dateien' },
] as const
type TabKey = (typeof TABS)[number]['key']

/**
 * Team-lead workspace page (NOT under manage): roster management for every
 * led team plus content tabs (Termine/Umfragen/Dateien) mounting the module
 * managers in lead mode — the server actions clamp every write to
 * TEAM ∩ leadOf and re-check leadership on every call.
 */
export default async function TeamLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, slug } = await params
  const sp = await searchParams
  const ctx = await getWorkspaceContext(slug)
  if (!ctx || ctx.viewer.leadOf.length === 0) notFound()
  const { project } = ctx
  const leadOf = ctx.viewer.leadOf
  const viewerIsPM = ctx.viewer.isPM
  const user = await getUser()
  const userId = user ? String(user.id) : ''

  const rawTab = typeof sp.tab === 'string' ? sp.tab : 'team'
  const modules = ctx.modules
  const availableTabs = TABS.filter((t) =>
    t.key === 'team' ||
    (t.key === 'termine' && modules.includes('calendar')) ||
    (t.key === 'umfragen' && modules.includes('polls')) ||
    (t.key === 'dateien' && modules.includes('files')),
  )
  const tab: TabKey = (availableTabs.find((t) => t.key === rawTab)?.key ?? 'team') as TabKey

  const payload = await getPayload({ config })

  // A lead sees TEAM content of the teams they lead — plus everything they
  // authored themselves (their drafts may target a subset of their teams).
  const leadContentWhere: Where = {
    and: [
      { project: { equals: project.id } },
      {
        or: [
          { and: [{ visibility: { equals: 'TEAM' } }, { visibilityTeams: { in: leadOf } }] },
          ...(userId ? [{ author: { equals: userId } }] : []),
        ],
      },
    ],
  }

  // Folder options for the quick upload popup (only fetched when needed).
  const quickFolders = modules.includes('files')
    ? (await payload.find({ collection: 'folders', where: { project: { equals: project.id } }, sort: 'name', limit: 500, depth: 0, overrideAccess: true })).docs.map((d) => ({ id: String((d as { id: string | number }).id), name: String((d as { name?: string }).name ?? '') }))
    : []

  let content: React.ReactNode = null

  if (tab === 'team') {
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
    const teams: TeamRoster[] = leadOf.map((team) => ({
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
    content = (
      <>
        <p className="text-text mb-6" style={{ color: 'var(--project-ink)' }}>
          Sie leiten {leadOf.length === 1 ? 'das Team' : 'die Teams'} {leadOf.join(', ')}. Hier nehmen Sie Projektmitglieder ins Team auf oder entfernen sie wieder.
        </p>
        <TeamRosterManager slug={slug} locale={locale} teams={teams} viewerIsPM={viewerIsPM} />
      </>
    )
  }

  if (tab === 'termine') {
    const res = await payload.find({ collection: 'calendar-events', where: leadContentWhere, sort: 'startDate', limit: 200, depth: 0, overrideAccess: true })
    const events: EventItem[] = await Promise.all(
      res.docs.map(async (doc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = doc as any
        return {
          id: String(e.id), title: e.title ?? '', startDate: e.startDate, endDate: e.endDate ?? null,
          allDay: e.allDay ?? false, location: e.location ?? null, category: e.category ?? null,
          visibility: e.visibility ?? 'PROJECT',
          visibilityTeams: Array.isArray(e.visibilityTeams) ? e.visibilityTeams : [],
          body: await lexicalToMarkdown(e.content),
          canManage: viewerIsPM || relId(e.author) === userId,
        }
      }),
    )
    content = (
      <>
        <p className="text-text mb-6" style={{ color: 'var(--project-ink)' }}>
          Termine für Ihre Teams. Neue Termine sind automatisch nur für die gewählten Teams sichtbar; fremde Termine sehen Sie hier, bearbeiten aber nur Ihre eigenen.
        </p>
        <CalendarManager slug={slug} locale={locale} events={events} teamCatalog={leadOf} leadMode />
      </>
    )
  }

  if (tab === 'umfragen') {
    const res = await payload.find({ collection: 'polls', where: leadContentWhere, sort: '-createdAt', limit: 100, depth: 0, overrideAccess: true })
    const polls: PollItem[] = await Promise.all(
      res.docs.map(async (doc) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = doc as any
        const [questions, votes] = await Promise.all([
          payload.count({ collection: 'poll-questions', where: { poll: { equals: p.id } }, overrideAccess: true }),
          payload.count({ collection: 'poll-votes', where: { poll: { equals: p.id } }, overrideAccess: true }),
        ])
        return {
          id: String(p.id), title: p.title, status: p.status ?? 'draft',
          questionCount: questions.totalDocs, voteCount: votes.totalDocs, closesAt: p.closesAt ?? null,
          canManage: viewerIsPM || relId(p.author) === userId,
        }
      }),
    )
    content = (
      <>
        <p className="text-text mb-6" style={{ color: 'var(--project-ink)' }}>
          Umfragen für Ihre Teams. Neue Umfragen erreichen nur die gewählten Teams; fremde Umfragen sehen Sie hier, verwalten aber nur Ihre eigenen.
        </p>
        <PollsManager slug={slug} locale={locale} polls={polls} teamCatalog={leadOf} leadMode />
      </>
    )
  }

  if (tab === 'dateien') {
    const [foldersRes, filesRes] = await Promise.all([
      payload.find({ collection: 'folders', where: { project: { equals: project.id } }, sort: 'name', limit: 500, depth: 0, overrideAccess: true }),
      payload.find({ collection: 'file-uploads', where: { project: { equals: project.id } }, sort: '-createdAt', limit: 1000, depth: 0, overrideAccess: true }),
    ])
    const folders: FolderItem[] = foldersRes.docs.map((d) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = d as any
      return { id: String(f.id), name: f.name ?? '', visibility: f.visibility ?? 'INTERNAL', visibilityTeams: Array.isArray(f.visibilityTeams) ? f.visibilityTeams : [] }
    })
    const files: FileItem[] = filesRes.docs.map((d) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = d as any
      return { id: String(f.id), label: f.label ?? null, filename: f.filename ?? '', url: f.url ?? null, mimeType: f.mimeType ?? null, filesize: f.filesize ?? null, visibility: f.visibility ?? 'INTERNAL', visibilityTeams: Array.isArray(f.visibilityTeams) ? f.visibilityTeams : [], folderId: relId(f.folder) }
    })
    content = (
      <>
        <p className="text-text mb-6" style={{ color: 'var(--project-ink)' }}>
          Dateiablage des Projekts. Mit der Sichtbarkeit „Team" und Ihren Team-Tags stellen Sie Dateien gezielt für Ihre Teams bereit.
        </p>
        <FilesManager slug={slug} locale={locale} folders={folders} files={files} teamCatalog={leadOf} />
      </>
    )
  }

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
        <TeamQuickActions slug={slug} locale={locale} leadOf={leadOf} modules={modules} folders={quickFolders} />
        {availableTabs.length > 1 && (
          <nav aria-label="Team-Bereiche" className="flex flex-wrap items-center gap-1.5 mb-6">
            {availableTabs.map((tb) => {
              const on = tab === tb.key
              return (
                <Link key={tb.key} href={tb.key === 'team' ? `/${locale}/dashboard/projekte/${slug}/team` : `/${locale}/dashboard/projekte/${slug}/team?tab=${tb.key}`}
                  aria-current={on ? 'page' : undefined}
                  className="text-small px-3 py-1.5 rounded-full border transition-colors"
                  style={{ background: on ? 'var(--project-dark)' : 'transparent', color: on ? 'var(--project-black)' : 'var(--project-accent)', borderColor: on ? 'var(--project-dark)' : 'color-mix(in srgb, var(--project-general) 35%, transparent)' }}>
                  {tb.label}
                </Link>
              )
            })}
          </nav>
        )}
        {content}
      </main>
    </div>
  )
}
