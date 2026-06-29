'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { registerAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null)
  const t = useTranslations('auth')

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Urban Kit</h1>
        <p className="text-gray-500 mt-1">{t('register')}</p>
      </div>
      <form action={action} className="space-y-4">
        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">{t('email')}</label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">{t('password')}</label>
          <Input id="password" name="password" type="password" required autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t('registerPending') : t('register')}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500">
        {t('hasAccount')}{' '}
        <Link href="../login" className="text-blue-600 hover:underline">{t('login')}</Link>
      </p>
    </div>
  )
}
