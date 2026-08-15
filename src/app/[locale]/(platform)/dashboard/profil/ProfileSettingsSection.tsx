// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check, Download, RotateCcw, Trash2 } from 'lucide-react'
import { resetProjectOrder, updateProfileSetting, type ProfileSettingKey } from '@/actions/profile-settings'
import { deleteAccountAction } from '@/actions/auth'
import { IconTooltip } from '@/components/platform/IconTooltip'

type Settings = { hideActivityFeed: boolean; hideAllProjects: boolean; hidePeopleSearch: boolean; profileVisible: boolean }

function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-small font-semibold opacity-50">{label}</h2>
      <div aria-hidden className="h-px mt-2" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
      {hint && <p className="text-small opacity-50 mt-2">{hint}</p>}
    </div>
  )
}

const rowClass = 'flex items-center justify-between gap-3 rounded-lg shadow-sm px-3 py-2.5 bg-[var(--app-white)]'

function RowText({ label, hint, labelColor }: { label: string; hint: string; labelColor?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-text font-medium leading-snug" style={{ color: labelColor ?? 'var(--app-ink-accent)' }}>
        {label}
      </p>
      <p className="text-small mt-0.5" style={{ color: 'var(--app-ink)', opacity: 0.6 }}>
        {hint}
      </p>
    </div>
  )
}

/**
 * Self-service settings on the profile page: dashboard section visibility and
 * project-card order, plus account-level actions (DSGVO data export, account
 * deletion). Toggles save immediately (optimistic, rolled back on error);
 * deletion requires typing a confirmation word and is blocked for PMs.
 */
export function ProfileSettingsSection({ settings, isPM }: { settings: Settings; isPM: boolean }) {
  const t = useTranslations('profile')
  const tc = useTranslations('common')
  const router = useRouter()
  const [local, setLocal] = useState(settings)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const toggle = (key: ProfileSettingKey) => {
    const value = !local[key]
    setError(null)
    setLocal((s) => ({ ...s, [key]: value }))
    startTransition(async () => {
      const res = await updateProfileSetting(key, value)
      if (res.error) {
        setLocal((s) => ({ ...s, [key]: !value }))
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  // Reset project order: brief ✓ feedback once done.
  const [resetPending, startReset] = useTransition()
  const [resetDone, setResetDone] = useState(false)
  const onResetOrder = () => {
    setError(null)
    startReset(async () => {
      const res = await resetProjectOrder()
      if (res.error) {
        setError(res.error)
      } else {
        setResetDone(true)
        setTimeout(() => setResetDone(false), 2000)
        router.refresh()
      }
    })
  }

  // Account deletion: confirm dialog gated by typing the confirmation word.
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteWord, setDeleteWord] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePending, startDelete] = useTransition()
  const confirmWord = t('deleteConfirmWord')
  const wordMatches = deleteWord.trim().toUpperCase() === confirmWord.toUpperCase()
  const onDelete = () => {
    startDelete(async () => {
      const res = await deleteAccountAction()
      // On success the action redirects to the login page — only errors return.
      if (res?.error) setDeleteError(res.error)
    })
  }

  const actionIconButton =
    'inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg cursor-pointer transition-colors bg-[var(--app-light)] hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-light))]'

  const switchRow = (key: ProfileSettingKey, label: string, hint: string) => (
    <div className={rowClass}>
      <RowText label={label} hint={hint} />
      <button
        type="button"
        role="switch"
        aria-checked={local[key]}
        aria-label={label}
        onClick={() => toggle(key)}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer"
        style={{ background: local[key] ? 'var(--app-accent)' : 'var(--app-light)' }}
      >
        <span
          aria-hidden
          className="inline-block h-4 w-4 rounded-full bg-[var(--app-white)] shadow-sm transition-transform"
          style={{ transform: local[key] ? 'translateX(1.125rem)' : 'translateX(0.125rem)' }}
        />
      </button>
    </div>
  )

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader label={t('settingsTitle')} hint={t('settingsHint')} />

      {error && <p className="text-small text-red-700">{error}</p>}

      <div className="flex flex-col gap-2">
        {switchRow('hideActivityFeed', t('settingHideActivityFeed'), t('settingHideActivityFeedHint'))}
        {switchRow('hideAllProjects', t('settingHideAllProjects'), t('settingHideAllProjectsHint'))}
        {switchRow('hidePeopleSearch', t('settingHidePeople'), t('settingHidePeopleHint'))}
        {switchRow('profileVisible', t('settingProfileVisible'), t('settingProfileVisibleHint'))}

        {/* Reset project-card order */}
        <div className={rowClass}>
          <RowText label={t('resetOrderLabel')} hint={t('resetOrderHint')} />
          <IconTooltip label={t('resetOrderLabel')}>
            <button
              type="button"
              onClick={onResetOrder}
              disabled={resetPending}
              aria-label={t('resetOrderLabel')}
              className={`${actionIconButton} disabled:opacity-50`}
              style={{ color: 'var(--app-ink-accent)' }}
            >
              {resetDone ? <Check className="h-5 w-5" aria-hidden /> : <RotateCcw className="h-5 w-5" aria-hidden />}
            </button>
          </IconTooltip>
        </div>

        {/* DSGVO data export */}
        <div className={rowClass}>
          <RowText label={t('exportLabel')} hint={t('exportHint')} />
          <IconTooltip label={t('exportLabel')}>
            <a
              href="/api/profile/export"
              download
              aria-label={t('exportLabel')}
              className={actionIconButton}
              style={{ color: 'var(--app-ink-accent)' }}
            >
              <Download className="h-5 w-5" aria-hidden />
            </a>
          </IconTooltip>
        </div>

        {/* Delete account */}
        <div className={rowClass}>
          <RowText
            label={t('deleteAccount')}
            hint={isPM ? t('deleteBlockedPM') : t('deleteAccountHint')}
            labelColor="var(--color-red-700, #b91c1c)"
          />
          <IconTooltip label={t('deleteAccount')}>
            <button
              type="button"
              onClick={() => {
                setDeleteWord('')
                setDeleteError(null)
                setDeleteOpen(true)
              }}
              disabled={isPM}
              aria-label={t('deleteAccount')}
              className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg cursor-pointer transition-colors bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-5 w-5" aria-hidden />
            </button>
          </IconTooltip>
        </div>
      </div>

      {/* Delete confirmation — portalled so the transition wrapper's retained
          transform can't hijack the fixed positioning. */}
      {deleteOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_srgb,var(--app-black)_45%,transparent)] backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deletePending) setDeleteOpen(false)
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              className="popover-in w-full max-w-sm rounded-xl p-6 shadow-xl"
              style={{ background: 'var(--app-white)', color: 'var(--app-ink)' }}
            >
              <h2 id="delete-account-title" className="text-display font-bold mb-2" style={{ color: 'var(--app-ink-accent)' }}>
                {t('deleteConfirmTitle')}
              </h2>
              <p className="text-small opacity-70 mb-4">{t('deleteConfirmBody')}</p>
              <label className="block text-small font-medium mb-1.5" htmlFor="delete-confirm-word">
                {t('deleteConfirmPrompt', { word: confirmWord })}
              </label>
              <input
                id="delete-confirm-word"
                type="text"
                value={deleteWord}
                onChange={(e) => setDeleteWord(e.target.value)}
                autoComplete="off"
                className="w-full px-4 h-10 rounded-lg text-small outline-none shadow-sm transition-all duration-200 focus:shadow-md focus:ring-2 bg-[var(--app-light)] mb-4"
                style={{ '--tw-ring-color': 'var(--color-red-700, #b91c1c)', color: 'var(--app-ink)' } as React.CSSProperties}
              />
              {deleteError && <p className="text-small text-red-700 mb-4">{deleteError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deletePending}
                  className="px-4 h-10 rounded-lg text-small font-medium bg-[var(--app-light)] transition-colors hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-light))] disabled:opacity-50 cursor-pointer"
                  style={{ color: 'var(--app-ink)' }}
                >
                  {tc('cancel')}
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={!wordMatches || deletePending}
                  className="px-4 h-10 rounded-lg text-small font-semibold bg-red-700 text-white transition-colors hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deletePending ? t('deleting') : t('deleteAccount')}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
