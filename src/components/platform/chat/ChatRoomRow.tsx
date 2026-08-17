// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { MoreVertical, Users, FolderKanban, UserCircle, Check, X } from 'lucide-react'
import { acceptInvite, leaveRoom, renameRoom, deleteRoom, setGroupProject } from '@/modules/chat/actions'
import type { MyProject, OverviewRoom } from './types'

function roomIcon(type: OverviewRoom['type']) {
  const className = 'h-4 w-4 shrink-0'
  if (type === 'project') return <FolderKanban className={className} aria-hidden />
  if (type === 'group') return <Users className={className} aria-hidden />
  return <UserCircle className={className} aria-hidden />
}

/**
 * One room row: open button + (for members/owners/PMs) an inline action menu
 * — rename, delete (two-step), leave, and group⇄project assignment. All
 * actions are server-guarded; the menu only mirrors what should succeed.
 */
export function ChatRoomRow({
  room,
  contextLabel,
  relTime,
  myProjects,
  onOpen,
  onChanged,
}: {
  room: OverviewRoom
  contextLabel: string | null
  relTime: (dateStr: string) => string
  myProjects: MyProject[]
  onOpen: () => void
  onChanged: () => void
}) {
  const t = useTranslations('chat')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [name, setName] = useState(room.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const roomName = room.name ?? (room.type === 'dm' ? t('dmFallback') : t('roomFallback'))
  const isPMOfRoomProject = !!room.project && myProjects.some((p) => p.slug === room.project!.slug && p.isPM)
  const canManage = room.type !== 'dm' && (room.role === 'owner' || isPMOfRoomProject)
  const canLeave = room.role !== 'owner'
  const assignableProjects = myProjects.filter((p) => p.isPM || p.groupAssignmentEnabled)
  const canAssign = room.type === 'group' && room.role === 'owner'
  const hasMenu = canManage || canLeave || canAssign

  const run = (fn: () => Promise<{ error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res.error) setError(res.error)
      setMenuOpen(false)
      setConfirmingDelete(false)
      setRenaming(false)
      setAssigning(false)
      onChanged()
    })
  }

  const closeMenu = () => {
    setMenuOpen(false)
    setConfirmingDelete(false)
    setAssigning(false)
  }

  const menuItem =
    'w-full text-left px-3 py-1.5 text-small cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_8%,transparent)]'

  if (room.status === 'invited') {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-[color-mix(in_srgb,var(--project-accent,var(--app-accent))_8%,transparent)]">
        <div className="min-w-0">
          <p className="text-small font-medium truncate flex items-center gap-1.5" style={{ color: 'var(--project-accent, var(--app-ink-accent))' }}>
            {roomIcon(room.type)}
            {roomName}
          </p>
          <p className="text-small opacity-60">{t('invitation')}</p>
        </div>
        <button
          type="button"
          onClick={() => run(() => acceptInvite(room.id))}
          className="shrink-0 h-8 px-3 rounded-lg text-small font-semibold cursor-pointer transition-colors bg-[var(--project-accent,var(--app-accent))] text-[var(--project-white,var(--app-white))] hover:opacity-90"
        >
          {t('acceptInvite')}
        </button>
      </div>
    )
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run(() => renameRoom(room.id, name))
            if (e.key === 'Escape') { e.stopPropagation(); setRenaming(false) }
          }}
          aria-label={t('renameRoom')}
          className="flex-1 min-w-0 px-3 h-9 rounded-lg text-small outline-none shadow-sm focus:ring-2 bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_5%,transparent)]"
          style={{ color: 'var(--project-ink, var(--app-ink))', '--tw-ring-color': 'var(--project-accent, var(--app-accent))' } as React.CSSProperties}
        />
        <button type="button" onClick={() => run(() => renameRoom(room.id, name))} aria-label={t('renameRoom')} className="p-1.5 cursor-pointer" style={{ color: 'var(--project-accent, var(--app-accent))' }}>
          <Check className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => setRenaming(false)} aria-label={t('close')} className="p-1.5 cursor-pointer opacity-60" style={{ color: 'var(--project-ink, var(--app-ink))' }}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div className="relative group/row">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 min-w-0 flex items-center gap-2 rounded-lg px-3 py-2 text-left cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--project-ink,var(--app-ink))_6%,transparent)]"
        >
          <span aria-hidden className="shrink-0 opacity-60" style={{ color: 'var(--project-accent, var(--app-accent))' }}>
            {roomIcon(room.type)}
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-baseline justify-between gap-2">
              <span className={`text-small truncate ${room.unread > 0 ? 'font-bold' : 'font-medium'}`} style={{ color: 'var(--project-accent, var(--app-ink-accent))' }}>
                {roomName}
              </span>
              <span className="text-[0.7rem] shrink-0 opacity-50">{relTime(room.lastMessageAt)}</span>
            </span>
            <span className="block text-small truncate opacity-60">
              {[contextLabel, room.lastMessagePreview || t('noMessages')].filter(Boolean).join(' · ')}
            </span>
          </span>
          {room.unread > 0 && (
            <span
              className="shrink-0 min-w-5 h-5 px-1.5 rounded-full text-[0.7rem] font-bold flex items-center justify-center bg-[var(--project-accent,var(--app-accent))] text-[var(--project-white,var(--app-white))]"
              aria-label={t('unreadBadge', { count: room.unread })}
            >
              {room.unread > 99 ? '99+' : room.unread}
            </span>
          )}
        </button>
        {hasMenu && (
          <button
            type="button"
            onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
            aria-label={t('roomActions')}
            aria-expanded={menuOpen}
            className="shrink-0 p-1.5 mr-1 rounded-md opacity-0 group-hover/row:opacity-60 focus-visible:opacity-60 aria-expanded:opacity-100 hover:!opacity-100 cursor-pointer transition-opacity"
            style={{ color: 'var(--project-ink, var(--app-ink))' }}
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {menuOpen && (
        <div
          className="absolute right-1 top-full z-10 w-52 rounded-lg shadow-lg overflow-hidden dropdown-enter"
          style={{ background: 'var(--project-white, var(--app-white))', color: 'var(--project-ink, var(--app-ink))', transformOrigin: 'top right' }}
        >
          {assigning ? (
            <>
              {assignableProjects.map((p) => (
                <button key={p.id} type="button" onClick={() => run(() => setGroupProject(room.id, p.id))} className={menuItem}>
                  {p.title}
                </button>
              ))}
              {assignableProjects.length === 0 && <p className="px-3 py-1.5 text-small opacity-50">{t('noAssignableProjects')}</p>}
              <button type="button" onClick={() => setAssigning(false)} className={`${menuItem} opacity-60`}>
                {t('back')}
              </button>
            </>
          ) : (
            <>
              {canManage && (
                <button type="button" onClick={() => { setRenaming(true); setMenuOpen(false) }} className={menuItem}>
                  {t('renameRoom')}
                </button>
              )}
              {canAssign && !room.project && assignableProjects.length > 0 && (
                <button type="button" onClick={() => setAssigning(true)} className={menuItem}>
                  {t('assignProject')}
                </button>
              )}
              {canAssign && room.project && (
                <button type="button" onClick={() => run(() => setGroupProject(room.id, null))} className={menuItem}>
                  {t('unassignProject')}
                </button>
              )}
              {canLeave && (
                <button type="button" onClick={() => run(() => leaveRoom(room.id))} className={menuItem}>
                  {t('leaveRoom')}
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => (confirmingDelete ? run(() => deleteRoom(room.id)) : setConfirmingDelete(true))}
                  className={`${menuItem} text-[var(--project-danger)] font-medium`}
                >
                  {confirmingDelete ? t('confirmDelete') : t('deleteRoom')}
                </button>
              )}
            </>
          )}
        </div>
      )}
      {error && <p className="px-3 pb-1 text-small text-[var(--project-danger)]">{error}</p>}
    </div>
  )
}
