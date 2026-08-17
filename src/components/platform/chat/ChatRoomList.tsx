// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquarePlus, Users, Plus, Check, X } from 'lucide-react'
import { createProjectRoom } from '@/modules/chat/actions'
import { ChatRoomRow } from './ChatRoomRow'
import { useRelativeTime } from './useRelativeTime'
import type { MyProject, OverviewRoom } from './types'

type Section = {
  key: string
  title: string
  /** Left accent color for project headers (chameleon light tone). */
  accentColor?: string
  /** Project slug — set on project sections; enables the PM "+" button. */
  projectSlug?: string
  canCreateRoom?: boolean
  rooms: OverviewRoom[]
}

/**
 * The popup's inbox, structured by project: one section per project (rooms +
 * project-assigned groups, PMs can create rooms right here — even the first
 * one), then unassigned groups, then DMs. Headers roll up unread counts so a
 * busy project signals activity at a glance.
 */
export function ChatRoomList({
  rooms,
  myProjects,
  canCreateGroups,
  currentProjectSlug,
  loading,
  onOpenRoom,
  onNewDm,
  onNewGroup,
  onChanged,
}: {
  rooms: OverviewRoom[]
  myProjects: MyProject[]
  canCreateGroups: boolean
  currentProjectSlug?: string | null
  loading: boolean
  onOpenRoom: (room: OverviewRoom) => void
  onNewDm: () => void
  onNewGroup: () => void
  onChanged: () => void
}) {
  const t = useTranslations('chat')
  const relTime = useRelativeTime()
  const [creatingFor, setCreatingFor] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const sections = useMemo((): Section[] => {
    const byProjectSlug = new Map<string, OverviewRoom[]>()
    const groups: OverviewRoom[] = []
    const dms: OverviewRoom[] = []
    for (const room of rooms) {
      if (room.project) {
        const list = byProjectSlug.get(room.project.slug) ?? []
        list.push(room)
        byProjectSlug.set(room.project.slug, list)
      } else if (room.type === 'group') {
        groups.push(room)
      } else if (room.type === 'dm') {
        dms.push(room)
      } else {
        groups.push(room)
      }
    }

    const projectSections: Section[] = []
    for (const p of myProjects) {
      const projectRooms = byProjectSlug.get(p.slug) ?? []
      byProjectSlug.delete(p.slug)
      // Non-PMs with zero rooms in a project get no empty section noise.
      if (projectRooms.length === 0 && !p.isPM) continue
      projectSections.push({
        key: `project:${p.slug}`,
        title: p.title,
        accentColor: p.accent,
        projectSlug: p.slug,
        canCreateRoom: p.isPM,
        rooms: projectRooms,
      })
    }
    // Rooms of projects the viewer left (or was never in): header from the chip.
    for (const [slug, list] of byProjectSlug) {
      projectSections.push({ key: `project:${slug}`, title: list[0].project!.title, accentColor: list[0].project!.accent, rooms: list })
    }
    // The current workspace's project surfaces first.
    if (currentProjectSlug) {
      projectSections.sort((a, b) =>
        (a.projectSlug === currentProjectSlug ? -1 : 0) - (b.projectSlug === currentProjectSlug ? -1 : 0),
      )
    }

    const out = [...projectSections]
    if (groups.length > 0) out.push({ key: 'groups', title: t('groupsHeading'), rooms: groups })
    if (dms.length > 0) out.push({ key: 'dms', title: t('dmsHeading'), rooms: dms })
    return out
  }, [rooms, myProjects, currentProjectSlug, t])

  const createRoom = (slug: string) => {
    setError(null)
    startTransition(async () => {
      const res = await createProjectRoom(slug, newRoomName)
      if (res.error) { setError(res.error); return }
      setCreatingFor(null)
      setNewRoomName('')
      onChanged()
    })
  }

  /** One-line "who is this" context per row — the cue exists before opening. */
  const contextLabel = (room: OverviewRoom): string | null => {
    if (room.type === 'dm') {
      const count = room.other?.sharedProjects?.length ?? 0
      return count > 0 ? t('sharedProjectsCount', { count }) : null
    }
    if (room.type === 'group') return t('memberCount', { count: room.memberCount ?? 0 })
    return null
  }

  const actionButton =
    'flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-small font-medium cursor-pointer transition-colors bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_18%,transparent)]'

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 flex gap-2 px-3 pt-3">
        <button type="button" onClick={onNewDm} className={actionButton} style={{ color: 'var(--project-accent, var(--app-accent))' }}>
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          {t('newDm')}
        </button>
        {canCreateGroups && (
          <button type="button" onClick={onNewGroup} className={actionButton} style={{ color: 'var(--project-accent, var(--app-accent))' }}>
            <Users className="h-4 w-4" aria-hidden />
            {t('newGroup')}
          </button>
        )}
      </div>

      {error && <p className="shrink-0 px-4 pt-2 text-small text-[var(--project-danger)]">{error}</p>}

      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-4">
        {sections.length === 0 && (
          <p className="m-auto text-small opacity-50 py-8">{loading ? '…' : t('empty')}</p>
        )}
        {sections.map((section) => {
          const sectionUnread = section.rooms.reduce((sum, r) => sum + r.unread, 0)
          return (
            <section key={section.key} aria-label={section.title}>
              <div className="flex items-center gap-2 px-1">
                {section.accentColor && (
                  <span aria-hidden className="h-3 w-1 rounded-full shrink-0" style={{ background: section.accentColor }} />
                )}
                <h3 className="flex-1 min-w-0 text-small font-semibold opacity-50 truncate">{section.title}</h3>
                {sectionUnread > 0 && (
                  <span className="shrink-0 min-w-4 h-4 px-1 rounded-full text-[0.65rem] font-bold flex items-center justify-center bg-[var(--project-accent,var(--app-accent))] text-[var(--project-white,var(--app-white))]">
                    {sectionUnread > 99 ? '99+' : sectionUnread}
                  </span>
                )}
                {section.canCreateRoom && section.projectSlug && (
                  <button
                    type="button"
                    onClick={() => { setCreatingFor(creatingFor === section.projectSlug ? null : section.projectSlug!); setNewRoomName('') }}
                    aria-label={t('newRoom')}
                    aria-expanded={creatingFor === section.projectSlug}
                    className="shrink-0 p-1 rounded-md opacity-50 hover:opacity-100 cursor-pointer transition-opacity"
                    style={{ color: 'var(--project-accent, var(--app-accent))' }}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>
              <div aria-hidden className="h-px mt-1 mb-1" style={{ background: 'color-mix(in srgb, var(--project-ink, var(--app-ink)) 12%, transparent)' }} />

              {creatingFor === section.projectSlug && section.projectSlug && (
                <div className="flex items-center gap-1.5 px-1 py-1.5">
                  <input
                    autoFocus
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createRoom(section.projectSlug!)
                      if (e.key === 'Escape') { e.stopPropagation(); setCreatingFor(null) }
                    }}
                    placeholder={t('roomNamePlaceholder')}
                    aria-label={t('roomNamePlaceholder')}
                    className="flex-1 min-w-0 px-3 h-9 rounded-lg text-small outline-none shadow-sm focus:ring-2 bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_5%,transparent)]"
                    style={{ color: 'var(--project-ink, var(--app-ink))', '--tw-ring-color': 'var(--project-accent, var(--app-accent))' } as React.CSSProperties}
                  />
                  <button type="button" onClick={() => createRoom(section.projectSlug!)} disabled={!newRoomName.trim()} aria-label={t('newRoom')} className="p-1.5 cursor-pointer disabled:opacity-40" style={{ color: 'var(--project-accent, var(--app-accent))' }}>
                    <Check className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => setCreatingFor(null)} aria-label={t('close')} className="p-1.5 cursor-pointer opacity-60" style={{ color: 'var(--project-ink, var(--app-ink))' }}>
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}

              <ul className="flex flex-col gap-0.5" role="list">
                {section.rooms.map((room) => (
                  <li key={room.id}>
                    <ChatRoomRow
                      room={room}
                      contextLabel={contextLabel(room)}
                      relTime={relTime}
                      myProjects={myProjects}
                      onOpen={() => onOpenRoom(room)}
                      onChanged={onChanged}
                    />
                  </li>
                ))}
                {section.rooms.length === 0 && (
                  <li className="px-1 py-1 text-small opacity-40">{t('noRoomsYet')}</li>
                )}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
