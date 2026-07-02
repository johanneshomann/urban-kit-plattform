'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { updateProfileAction } from '@/actions/auth'
import { CheckCircle } from 'lucide-react'

const AFFILIATION_OPTIONS = ['citizen', 'student', 'cityEmployee', 'academia', 'other'] as const

interface ProfileFormProps {
  firstName: string
  lastName: string
  email: string
  affiliations: string[]
  cityInfo: { organization: string; fachbereich: string; position: string }
}

export function ProfileForm({ firstName, lastName, email, affiliations, cityInfo }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, null)
  const t = useTranslations('profile')
  const [selected, setSelected] = useState<string[]>(affiliations)
  const isCityEmployee = selected.includes('cityEmployee')

  const toggleAffiliation = (value: string, checked: boolean) => {
    setSelected(prev => (checked ? [...prev, value] : prev.filter(v => v !== value)))
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border text-text bg-white outline-none transition-colors focus:border-[var(--plattform)]"
  const labelClass = "block text-small font-medium mb-1.5"

  return (
    <form action={action} className="flex flex-col gap-10">

      {state === null && !pending ? null : null}

      {/* Feedback */}
      {state?.error && (
        <p className="px-4 py-3 rounded-xl text-small text-red-600 bg-red-50 border border-red-200">
          {state.error}
        </p>
      )}
      {state === null && (
        <p className="px-4 py-3 rounded-xl text-small flex items-center gap-2 text-green-700 bg-green-50 border border-green-200">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {t('saved')}
        </p>
      )}

      {/* Name */}
      <section className="flex flex-col gap-4">
        <h2 className="text-text font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>{t('personalData')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="firstName">{t('firstName')}</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              defaultValue={firstName}
              className={inputClass}
              placeholder={t('firstNamePlaceholder')}
              style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lastName">{t('lastName')}</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              defaultValue={lastName}
              className={inputClass}
              placeholder={t('lastNamePlaceholder')}
              style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="email">{t('email')}</label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            className={`${inputClass} opacity-50 cursor-not-allowed`}
            style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
          />
          <p className="text-small opacity-40 mt-1.5">{t('emailReadonly')}</p>
        </div>
      </section>

      {/* Background / affiliations */}
      <section className="flex flex-col gap-4">
        <h2 className="text-text font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>{t('background')}</h2>
        <p className="text-small opacity-50 -mt-2">{t('backgroundHint')}</p>
        <div className="flex flex-wrap gap-2">
          {AFFILIATION_OPTIONS.map(value => {
            const active = selected.includes(value)
            return (
              <label
                key={value}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-small cursor-pointer transition-colors select-none"
                style={{
                  borderColor: active
                    ? 'var(--plattform)'
                    : 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)',
                  background: active ? 'color-mix(in srgb, var(--plattform) 10%, white)' : 'white',
                }}
              >
                <input
                  type="checkbox"
                  name="affiliations"
                  value={value}
                  checked={active}
                  onChange={e => toggleAffiliation(value, e.target.checked)}
                  className="accent-[var(--plattform)]"
                />
                {t(`affiliation.${value}`)}
              </label>
            )
          })}
        </div>

        {isCityEmployee && (
          <div
            className="flex flex-col gap-4 p-4 rounded-xl border"
            style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 12%, transparent)', background: 'color-mix(in srgb, var(--plattform) 4%, white)' }}
          >
            <p className="text-small font-medium">{t('cityInfoTitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="cityOrganization">{t('cityOrganization')}</label>
                <input
                  id="cityOrganization"
                  name="cityOrganization"
                  type="text"
                  defaultValue={cityInfo.organization}
                  className={inputClass}
                  placeholder={t('cityOrganizationPlaceholder')}
                  style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="cityFachbereich">{t('cityFachbereich')}</label>
                <input
                  id="cityFachbereich"
                  name="cityFachbereich"
                  type="text"
                  defaultValue={cityInfo.fachbereich}
                  className={inputClass}
                  placeholder={t('cityFachbereichPlaceholder')}
                  style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="cityPosition">{t('cityPosition')}</label>
                <input
                  id="cityPosition"
                  name="cityPosition"
                  type="text"
                  defaultValue={cityInfo.position}
                  className={inputClass}
                  placeholder={t('cityPositionPlaceholder')}
                  style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Password */}
      <section className="flex flex-col gap-4">
        <h2 className="text-text font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>{t('changePassword')}</h2>
        <div>
          <label className={labelClass} htmlFor="currentPassword">{t('currentPassword')}</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className={inputClass}
            placeholder="••••••••"
            style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="newPassword">{t('newPassword')}</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className={inputClass}
            placeholder="••••••••"
            style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
          />
          <p className="text-small opacity-40 mt-1.5">{t('newPasswordHint')}</p>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="self-start px-6 py-3 rounded-xl text-text font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
        style={{ background: pending ? 'var(--plattform)' : 'var(--plattform)' }}
        onMouseEnter={e => !pending && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--plattform-accent)')}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--plattform)')}
      >
        {pending ? t('saving') : t('save')}
      </button>

    </form>
  )
}
