'use client'

import { useActionState } from 'react'
import { submitJoinRequest } from '@/actions/join-request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function JoinRequestForm({ projectId, projectSlug, locale }: {
  projectId: string
  projectSlug: string
  locale: string
}) {
  const [state, action, pending] = useActionState(submitJoinRequest, null)

  if (state?.success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
        Anfrage gesendet. Du wirst benachrichtigt, sobald sie bearbeitet wurde.
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="projectSlug" value={projectSlug} />
      <input type="hidden" name="locale" value={locale} />
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{state.error}</p>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">E-Mail</label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">Nachricht (optional)</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 resize-none"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Wird gesendet...' : 'Anfrage senden'}
      </Button>
    </form>
  )
}
