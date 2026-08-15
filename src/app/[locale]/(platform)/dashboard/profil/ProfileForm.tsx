// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { updateProfileAction } from '@/actions/auth'
import { CheckCircle, Plus, UserCircle, X } from 'lucide-react'
import { PROFILE_BADGE_ICONS, PROFILE_BADGE_VALUES, type ProfileBadge } from '@/lib/profile-badges'

const AFFILIATION_OPTIONS = ['citizen', 'student', 'cityEmployee', 'academia', 'other'] as const
const GENDER_OPTIONS = ['female', 'male', 'diverse', 'noAnswer'] as const
const STADTBEREICH_OPTIONS = ['innenstadt', 'norden', 'sueden', 'osten', 'westen'] as const

const GALLERY_MAX = 12

interface ProfileFormProps {
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  profileBadge: string
  bio: string
  galleryImages: { id: string; url: string }[]
  gender: string
  birthYear: number | null
  stadtbereich: string
  affiliations: string[]
  cityInfo: { organization: string; fachbereich: string; position: string }
}

/** Dashboard section header: sentence-case label + hairline divider. */
function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-small font-semibold opacity-50">{label}</h2>
      <div aria-hidden className="h-px mt-2" style={{ background: 'color-mix(in srgb, var(--app-ink) 12%, transparent)' }} />
      {hint && <p className="text-small opacity-50 mt-2">{hint}</p>}
    </div>
  )
}

export function ProfileForm({ firstName, lastName, email, avatarUrl, profileBadge, bio, galleryImages, gender, birthYear, stadtbereich, affiliations, cityInfo }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, null)
  const t = useTranslations('profile')
  const tax = useTranslations('taxonomy')
  const [selected, setSelected] = useState<string[]>(affiliations)
  const isCityEmployee = selected.includes('cityEmployee')

  // Avatar: local preview for a freshly picked file, removal flag for the action.
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const shownAvatar = avatarRemoved ? null : (avatarPreview ?? avatarUrl)

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarRemoved(false)
    setAvatarPreview(URL.createObjectURL(file))
  }
  const onAvatarRemove = () => {
    setAvatarRemoved(true)
    setAvatarPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Badge: one of the curated icons, overlaid bottom-right on the avatar.
  const [badge, setBadge] = useState<string>(profileBadge)
  const BadgeIcon = (PROFILE_BADGE_VALUES as readonly string[]).includes(badge)
    ? PROFILE_BADGE_ICONS[badge as ProfileBadge]
    : null

  // Gallery: kept existing images (hidden `galleryKeep` inputs) + newly picked
  // files, accumulated across picks and mirrored into the real file input via
  // DataTransfer so the server action receives exactly what's previewed.
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [keptIds, setKeptIds] = useState<string[]>(galleryImages.map((g) => g.id))
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const galleryCount = keptIds.length + newImages.length

  const syncGalleryInput = (files: File[]) => {
    const dt = new DataTransfer()
    files.forEach((f) => dt.items.add(f))
    if (galleryInputRef.current) galleryInputRef.current.files = dt.files
  }
  const onGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'))
    if (!picked.length) return
    const room = Math.max(0, GALLERY_MAX - keptIds.length - newImages.length)
    const next = [...newImages, ...picked.slice(0, room).map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]
    setNewImages(next)
    syncGalleryInput(next.map((n) => n.file))
  }
  const removeNewImage = (preview: string) => {
    const next = newImages.filter((n) => n.preview !== preview)
    setNewImages(next)
    syncGalleryInput(next.map((n) => n.file))
  }

  const toggleAffiliation = (value: string, checked: boolean) => {
    setSelected(prev => (checked ? [...prev, value] : prev.filter(v => v !== value)))
  }

  // Saved toast: the action's success value is `null`, which is also the
  // initial state — so only show after a submission actually ran.
  const [showSaved, setShowSaved] = useState(false)
  const wasPending = useRef(false)
  useEffect(() => {
    if (pending) {
      wasPending.current = true
      setShowSaved(false)
      return
    }
    if (wasPending.current && state === null) {
      wasPending.current = false
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [pending, state])

  // Borderless controls per dashboard rules: white surface on the grey page,
  // definition via focus ring + shadow, all h-10 / rounded-lg.
  const inputBase =
    'w-full px-4 h-10 rounded-lg text-small outline-none shadow-sm transition-all duration-200 focus:shadow-md focus:ring-2 bg-[var(--app-white)]'
  const ringStyle = { '--tw-ring-color': 'var(--app-accent)', color: 'var(--app-ink)' } as React.CSSProperties
  const labelClass = 'block text-small font-medium mb-1.5'

  return (
    <form action={action} className="flex flex-col gap-10">

      {/* Errors stay inline at the top; success floats as a toast (below) */}
      {state?.error && (
        <p className="px-4 py-3 rounded-lg text-small text-red-700 bg-red-50">
          {state.error}
        </p>
      )}
      {showSaved && (
        <div
          role="status"
          className="toast-in fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-4 h-11 rounded-lg shadow-lg text-small font-medium"
          style={{ background: 'var(--app-ink-accent)', color: 'var(--app-white)' }}
        >
          <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />
          {t('saved')}
        </div>
      )}

      {/* Name + email — first section, headed by the page title itself */}
      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="firstName">{t('firstName')}</label>
            <input id="firstName" name="firstName" type="text" defaultValue={firstName} className={inputBase} placeholder={t('firstNamePlaceholder')} style={ringStyle} />
          </div>
          <div>
            <label className={labelClass} htmlFor="lastName">{t('lastName')}</label>
            <input id="lastName" name="lastName" type="text" defaultValue={lastName} className={inputBase} placeholder={t('lastNamePlaceholder')} style={ringStyle} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="email">{t('email')}</label>
          <input id="email" type="email" value={email} disabled className={`${inputBase} opacity-50 cursor-not-allowed`} style={ringStyle} />
          <p className="text-small opacity-40 mt-1.5">{t('emailReadonly')}</p>
        </div>
      </section>

      {/* Profile picture */}
      <section className="flex flex-col gap-4">
        <SectionHeader label={t('avatar')} hint={t('avatarHint')} />
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--app-accent) 12%, transparent)' }}
            >
              {shownAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownAvatar} alt="" aria-hidden className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-10 h-10" style={{ color: 'var(--app-accent)' }} aria-hidden />
              )}
            </div>
            {BadgeIcon && (
              <span
                aria-hidden
                className="absolute -bottom-0.5 -right-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm"
                style={{ background: 'var(--app-accent)', color: 'var(--app-white)' }}
              >
                <BadgeIcon className="h-4 w-4" />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label
              className="inline-flex items-center h-10 px-4 rounded-lg text-small font-medium cursor-pointer transition-all duration-200 bg-[var(--app-white)] hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))] hover:shadow-sm"
              style={{ color: 'var(--app-ink)' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                name="avatar"
                accept="image/*"
                onChange={onAvatarPick}
                className="sr-only"
              />
              {t('avatarUpload')}
            </label>
            {shownAvatar && (
              <button
                type="button"
                onClick={onAvatarRemove}
                className="inline-flex items-center h-10 px-4 rounded-lg text-small cursor-pointer transition-opacity underline opacity-60 hover:opacity-100"
                style={{ color: 'var(--app-ink)' }}
              >
                {t('avatarRemove')}
              </button>
            )}
          </div>
          <input type="hidden" name="removeAvatar" value={avatarRemoved ? '1' : ''} />
        </div>

        {/* Badge picker — a small icon shown as an overlay on the avatar */}
        <div>
          <p className="text-small font-medium">{t('badgeTitle')}</p>
          <p className="text-small opacity-50 mt-0.5 mb-2">{t('badgeHint')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBadge('')}
              aria-pressed={badge === ''}
              className={`flex items-center h-10 px-4 rounded-lg text-small cursor-pointer transition-all duration-200 select-none hover:shadow-sm ${
                badge === ''
                  ? 'bg-[var(--app-accent)] text-[var(--app-white)]'
                  : 'bg-[var(--app-white)] hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))]'
              }`}
              style={badge === '' ? undefined : { color: 'var(--app-ink)' }}
            >
              {t('badgeNone')}
            </button>
            {PROFILE_BADGE_VALUES.map((value) => {
              const Icon = PROFILE_BADGE_ICONS[value]
              const active = badge === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBadge(value)}
                  aria-pressed={active}
                  aria-label={t(`badgeIcon.${value}`)}
                  title={t(`badgeIcon.${value}`)}
                  className={`inline-flex items-center justify-center h-10 w-10 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    active
                      ? 'bg-[var(--app-accent)] text-[var(--app-white)]'
                      : 'bg-[var(--app-white)] hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))]'
                  }`}
                  style={active ? undefined : { color: 'var(--app-ink)' }}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </button>
              )
            })}
          </div>
        </div>
        <input type="hidden" name="profileBadge" value={badge} />
      </section>

      {/* About me */}
      <section className="flex flex-col gap-4">
        <SectionHeader label={t('about')} hint={t('aboutHint')} />
        <textarea
          id="bio"
          name="bio"
          defaultValue={bio}
          maxLength={1000}
          rows={5}
          placeholder={t('aboutPlaceholder')}
          className="w-full px-4 py-3 rounded-lg text-small outline-none shadow-sm transition-all duration-200 focus:shadow-md focus:ring-2 bg-[var(--app-white)] resize-y min-h-28"
          style={ringStyle}
        />
      </section>

      {/* Personal gallery */}
      <section className="flex flex-col gap-4">
        <SectionHeader label={t('galleryTitle')} hint={t('galleryHint')} />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {galleryImages.filter((g) => keptIds.includes(g.id)).map((g) => (
            <div key={g.id} className="relative aspect-square rounded-lg overflow-hidden shadow-sm group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt="" aria-hidden className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setKeptIds((ids) => ids.filter((id) => id !== g.id))}
                aria-label={t('galleryRemove')}
                className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-7 w-7 rounded-full bg-[var(--app-white)] shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                style={{ color: 'var(--app-ink-accent)' }}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          {newImages.map((n) => (
            <div key={n.preview} className="relative aspect-square rounded-lg overflow-hidden shadow-sm group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.preview} alt="" aria-hidden className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewImage(n.preview)}
                aria-label={t('galleryRemove')}
                className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-7 w-7 rounded-full bg-[var(--app-white)] shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                style={{ color: 'var(--app-ink-accent)' }}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          {galleryCount < GALLERY_MAX && (
            <label
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-200 bg-[var(--app-white)] shadow-sm hover:shadow-md hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))]"
              style={{ color: 'var(--app-ink)' }}
            >
              <input
                ref={galleryInputRef}
                type="file"
                name="galleryImages"
                accept="image/*"
                multiple
                onChange={onGalleryPick}
                className="sr-only"
              />
              <Plus className="h-5 w-5 opacity-60" aria-hidden />
              <span className="text-small opacity-60">{t('galleryAdd')}</span>
            </label>
          )}
        </div>
        {keptIds.map((id) => (
          <input key={id} type="hidden" name="galleryKeep" value={id} />
        ))}
      </section>

      {/* Voluntary demographics */}
      <section className="flex flex-col gap-4">
        <SectionHeader label={t('demographics')} hint={t('demographicsHint')} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="gender">{t('gender')}</label>
            <select id="gender" name="gender" defaultValue={gender} className={`${inputBase} cursor-pointer`} style={ringStyle}>
              <option value="">{t('noSelection')}</option>
              {GENDER_OPTIONS.map(v => (
                <option key={v} value={v}>{t(`genderOption.${v}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="birthYear">{t('birthYear')}</label>
            <input
              id="birthYear"
              name="birthYear"
              type="number"
              inputMode="numeric"
              min={1900}
              max={new Date().getFullYear()}
              defaultValue={birthYear ?? ''}
              className={inputBase}
              placeholder="1990"
              style={ringStyle}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="stadtbereich">{t('stadtbereich')}</label>
            <select id="stadtbereich" name="stadtbereich" defaultValue={stadtbereich} className={`${inputBase} cursor-pointer`} style={ringStyle}>
              <option value="">{t('noSelection')}</option>
              {STADTBEREICH_OPTIONS.map(v => (
                <option key={v} value={v}>{tax(`stadtbereich.${v}`)}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Background / affiliations */}
      <section className="flex flex-col gap-4">
        <SectionHeader label={t('background')} hint={t('backgroundHint')} />
        <div className="flex flex-wrap gap-2">
          {AFFILIATION_OPTIONS.map(value => {
            const active = selected.includes(value)
            return (
              <label
                key={value}
                className={`flex items-center h-10 px-4 rounded-lg text-small cursor-pointer transition-all duration-200 select-none hover:shadow-sm ${
                  active
                    ? 'bg-[var(--app-accent)] text-[var(--app-white)]'
                    : 'bg-[var(--app-white)] hover:bg-[color-mix(in_srgb,var(--app-ink)_16%,var(--app-white))]'
                }`}
                style={active ? undefined : { color: 'var(--app-ink)' }}
              >
                <input
                  type="checkbox"
                  name="affiliations"
                  value={value}
                  checked={active}
                  onChange={e => toggleAffiliation(value, e.target.checked)}
                  className="sr-only"
                />
                {t(`affiliation.${value}`)}
              </label>
            )
          })}
        </div>

        {isCityEmployee && (
          <div
            className="flex flex-col gap-4 p-4 rounded-xl"
            style={{ background: 'var(--app-white)' }}
          >
            <p className="text-small font-medium">{t('cityInfoTitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="cityOrganization">{t('cityOrganization')}</label>
                <input id="cityOrganization" name="cityOrganization" type="text" defaultValue={cityInfo.organization} className={`${inputBase} bg-[var(--app-light)]`} placeholder={t('cityOrganizationPlaceholder')} style={ringStyle} />
              </div>
              <div>
                <label className={labelClass} htmlFor="cityFachbereich">{t('cityFachbereich')}</label>
                <input id="cityFachbereich" name="cityFachbereich" type="text" defaultValue={cityInfo.fachbereich} className={`${inputBase} bg-[var(--app-light)]`} placeholder={t('cityFachbereichPlaceholder')} style={ringStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="cityPosition">{t('cityPosition')}</label>
                <input id="cityPosition" name="cityPosition" type="text" defaultValue={cityInfo.position} className={`${inputBase} bg-[var(--app-light)]`} placeholder={t('cityPositionPlaceholder')} style={ringStyle} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Password */}
      <section className="flex flex-col gap-4">
        <SectionHeader label={t('changePassword')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="currentPassword">{t('currentPassword')}</label>
            <input id="currentPassword" name="currentPassword" type="password" className={inputBase} placeholder="••••••••" style={ringStyle} />
          </div>
          <div>
            <label className={labelClass} htmlFor="newPassword">{t('newPassword')}</label>
            <input id="newPassword" name="newPassword" type="password" className={inputBase} placeholder="••••••••" style={ringStyle} />
            <p className="text-small opacity-40 mt-1.5">{t('newPasswordHint')}</p>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="self-start px-6 h-11 rounded-lg text-small font-semibold bg-[var(--app-accent)] text-[var(--app-white)] transition-colors hover:bg-[var(--app-ink-accent)] disabled:opacity-50 cursor-pointer"
      >
        {pending ? t('saving') : t('save')}
      </button>

    </form>
  )
}
