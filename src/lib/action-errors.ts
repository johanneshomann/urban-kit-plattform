// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getLocale, getTranslations } from 'next-intl/server'
import type messages from '../../messages/de.json'

/** Keys of the `actionErrors` catalog namespace (typed off the German source catalog). */
export type ActionErrorKey = keyof typeof messages.actionErrors

/**
 * Localised `{ error }` result for server actions.
 *
 * Actions return error TEXT that the client renders verbatim, so it has to
 * follow the UI language. The locale comes from the request (next-intl's
 * middleware header — the same source `getLocale()` uses in auth.ts), the text
 * from the `actionErrors` namespace. Only reached on error paths, so the
 * per-call `getTranslations` is cheap enough.
 *
 * Usage: `return actionError('forbidden')` inside an async action.
 */
export async function actionError(key: ActionErrorKey, values?: Record<string, string | number>): Promise<{ error: string }> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'actionErrors' })
  return { error: t(key, values) }
}
