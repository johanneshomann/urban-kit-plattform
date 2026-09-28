// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * BCP-47 tag for `Date#toLocale*String` / `Intl.*Format` derived from the
 * app locale. Centralised so every date in the UI follows the language
 * switch — a hardcoded `'de-DE'` would render "27. Sept. 2026" in the
 * English UI.
 */
export const intlLocale = (locale: string): string => (locale === 'en' ? 'en-GB' : 'de-DE')
