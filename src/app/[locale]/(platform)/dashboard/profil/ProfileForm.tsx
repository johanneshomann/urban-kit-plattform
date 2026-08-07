'use client'

import { useActionState, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { updateProfileAction } from '@/actions/auth'
import { CheckCircle, UserCircle } from 'lucide-react'

const AFFILIATION_OPTIONS = ['citizen', 'student', 'cityEmployee', 'academia', 'other'] as const
const GENDER_OPTIONS = ['female', 'male', 'diverse', 'noAnswer'] as const
const STADTBEREICH_OPTIONS = ['innenstadt', 'norden', 'sueden', 'osten', 'westen'] as const

interface ProfileFormProps {
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
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

export function ProfileForm({ firstName, lastName, email, avatarUrl, gender, birthYear, stadtbereich, affiliations, cityInfo }: ProfileFormProps) {
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

  const toggleAffiliation = (value: string, checked: boolean) => {
    setSelected(prev => (checked ? [...prev, value] : prev.filter(v => v !== value)))
  }

  // Borderless controls per dashboard rules: white surface on the grey page,
  // definition via focus ring + shadow, all h-10 / rounded-lg.
  const inputBase =
    'w-full px-4 h-10 rounded-lg text-small outline-none shadow-sm transition-all duration-200 focus:shadow-md focus:ring-2 bg-[var(--app-white)]'
  const ringStyle = { '--tw-ring-color': 'var(--app-accent)', color: 'var(--app-ink)' } as React.CSSProperties
  const labelClass = 'block text-small font-medium mb-1.5'

  return (
    <form action={action} className="flex flex-col gap-10">

      {/* Feedback */}
      {state?.error && (
        <p className="px-4 py-3 rounded-lg text-small text-red-700 bg-red-50">
          {state.error}
        </p>
      )}
      {state === null && (
        <p className="px-4 py-3 rounded-lg text-small flex items-center gap-2 text-green-700 bg-green-50">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {t('saved')}
        </p>
      )}

      {/* Profile picture */}
      <section className="flex flex-col gap-4">
        <SectionHeader label={t('avatar')} hint={t('avatarHint')} />
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: 'color-mix(in srgb, var(--app-accent) 12%, transparent)' }}
          >
            {shownAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownAvatar} alt="" aria-hidden className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-10 h-10" style={{ color: 'var(--app-accent)' }} aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label
              className="inline-flex items-center h-10 px-4 rounded-lg text-small font-medium cursor-pointer transition-all duration-200 bg-[var(--app-white)] hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))] hover:shadow-sm"
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
      </section>

      {/* Name + email */}
      <section className="flex flex-col gap-4">
        <SectionHeader label={t('personalData')} />
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
                    : 'bg-[var(--app-white)] hover:bg-[color-mix(in_srgb,var(--app-ink)_8%,var(--app-white))]'
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
        <div>
          <label className={labelClass} htmlFor="currentPassword">{t('currentPassword')}</label>
          <input id="currentPassword" name="currentPassword" type="password" className={inputBase} placeholder="••••••••" style={ringStyle} />
        </div>
        <div>
          <label className={labelClass} htmlFor="newPassword">{t('newPassword')}</label>
          <input id="newPassword" name="newPassword" type="password" className={inputBase} placeholder="••••••••" style={ringStyle} />
          <p className="text-small opacity-40 mt-1.5">{t('newPasswordHint')}</p>
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
