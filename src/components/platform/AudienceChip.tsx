// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslations } from 'next-intl'
import { Eye, Users } from 'lucide-react'

/**
 * One shared audience marker for every module list/card, unified on the
 * project-light chip style. Every visibility gets its chip:
 * PUBLIC → "Sichtbarkeit: Öffentlich", PROJECT (incl. legacy INTERNAL/unset) →
 * "Sichtbarkeit: Alle im Projekt", TEAM → "Sichtbarkeit: Team(s)" plus one
 * name chip per addressed team.
 * Non-async, so `useTranslations` works in server and client trees alike.
 */
const chipCls = 'inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap max-w-[16rem]'
const chipStyle = { background: 'var(--project-light)', color: 'var(--project-ink)' }
const iconCls = 'w-3 h-3 shrink-0'

export function AudienceChip({ visibility, visibilityTeams }: {
  visibility?: string | null
  visibilityTeams?: string[] | null
}) {
  const t = useTranslations('common')

  if (visibility === 'PUBLIC') {
    return (
      <span title={t('audiencePublicTitle')} className={chipCls} style={chipStyle}>
        <Eye aria-hidden className={iconCls} />
        <span className="truncate">{t('audiencePublic')}</span>
      </span>
    )
  }

  if (visibility === 'TEAM') {
    const teams = (visibilityTeams ?? []).filter(Boolean)
    return (
      <>
        <span title={t('audienceTeamTitle')} className={chipCls} style={chipStyle}>
          <Eye aria-hidden className={iconCls} />
          <span className="truncate">{teams.length > 1 ? t('audienceTeamVisPlural') : t('audienceTeamVis')}</span>
        </span>
        {teams.map((team) => (
          <span key={team} title={t('audienceTeamTitle')} className={chipCls} style={chipStyle}>
            <Users aria-hidden className={iconCls} />
            <span className="truncate">{team}</span>
          </span>
        ))}
      </>
    )
  }

  // PROJECT — also the safe default for legacy INTERNAL / unset values
  return (
    <span title={t('audienceProjectTitle')} className={chipCls} style={chipStyle}>
      <Eye aria-hidden className={iconCls} />
      <span className="truncate">{t('audienceProject')}</span>
    </span>
  )
}
