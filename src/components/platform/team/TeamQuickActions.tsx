// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState } from 'react'
import { CalendarPlus, BarChart2, Upload } from 'lucide-react'
import { EventFormModal } from '@/components/platform/manage/CalendarManager'
import { PollFormModal } from '@/components/platform/manage/PollFormModal'
import { FileUploadModal } from '@/components/platform/manage/FilesManager'

/**
 * Quick-create row for ONE led team (rendered inside that team's section on
 * the team page): new content opens the shared popups in lead mode with THIS
 * team preselected — the lead's other led teams stay available as pills.
 * Only enabled modules get a button.
 */
export function TeamQuickActions({ slug, locale, team, leadOf, modules, folders }: {
  slug: string
  locale: string
  /** The team this row creates content for (preselected in the popups). */
  team: string
  /** All teams the viewer leads (tag options in the popups). */
  leadOf: string[]
  modules: string[]
  folders: { id: string; name: string }[]
}) {
  const [modal, setModal] = useState<'termin' | 'umfrage' | 'datei' | null>(null)

  const actions = [
    { key: 'termin' as const, label: 'Neuer Team-Termin', icon: CalendarPlus, enabled: modules.includes('calendar') },
    { key: 'umfrage' as const, label: 'Neue Team-Umfrage', icon: BarChart2, enabled: modules.includes('polls') },
    { key: 'datei' as const, label: 'Neue Team-Datei', icon: Upload, enabled: modules.includes('files') },
  ].filter((a) => a.enabled)

  if (actions.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((a) => (
          <button key={a.key} type="button" onClick={() => setModal(a.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small font-semibold border"
            style={{ color: 'var(--project-accent)', borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', background: 'var(--project-white)' }}>
            <a.icon className="w-4 h-4" /> {a.label}
          </button>
        ))}
      </div>

      {modal === 'termin' && (
        <EventFormModal slug={slug} locale={locale} event={null} teamCatalog={leadOf} leadMode defaultTeams={[team]} onClose={() => setModal(null)} />
      )}
      {modal === 'umfrage' && (
        <PollFormModal slug={slug} locale={locale} editing={null} teamCatalog={leadOf} leadMode defaultTeams={[team]} onClose={() => setModal(null)} />
      )}
      {modal === 'datei' && (
        <FileUploadModal slug={slug} locale={locale} folders={folders} teamCatalog={leadOf} defaultVisibility="TEAM" defaultTeams={[team]} onClose={() => setModal(null)} />
      )}
    </>
  )
}
