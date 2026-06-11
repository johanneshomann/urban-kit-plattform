'use client'

import { useActionState } from 'react'
import { updateProfileAction } from '@/actions/auth'
import { CheckCircle } from 'lucide-react'

interface ProfileFormProps {
  firstName: string
  lastName: string
  email: string
}

export function ProfileForm({ firstName, lastName, email }: ProfileFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, null)

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
          Änderungen gespeichert.
        </p>
      )}

      {/* Name */}
      <section className="flex flex-col gap-4">
        <h2 className="text-text font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>Persönliche Daten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="firstName">Vorname</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              defaultValue={firstName}
              className={inputClass}
              placeholder="Max"
              style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lastName">Nachname</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              defaultValue={lastName}
              className={inputClass}
              placeholder="Mustermann"
              style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="email">E-Mail</label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            className={`${inputClass} opacity-50 cursor-not-allowed`}
            style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
          />
          <p className="text-small opacity-40 mt-1.5">E-Mail-Adresse kann nicht geändert werden.</p>
        </div>
      </section>

      {/* Password */}
      <section className="flex flex-col gap-4">
        <h2 className="text-text font-semibold" style={{ color: 'var(--plattform-ink-accent)' }}>Passwort ändern</h2>
        <div>
          <label className={labelClass} htmlFor="currentPassword">Aktuelles Passwort</label>
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
          <label className={labelClass} htmlFor="newPassword">Neues Passwort</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className={inputClass}
            placeholder="••••••••"
            style={{ borderColor: 'color-mix(in srgb, var(--plattform-ink) 20%, transparent)' }}
          />
          <p className="text-small opacity-40 mt-1.5">Nur ausfüllen wenn du das Passwort ändern möchtest.</p>
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
        {pending ? 'Wird gespeichert…' : 'Speichern'}
      </button>

    </form>
  )
}
