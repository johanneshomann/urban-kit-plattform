/**
 * Validation helpers for localized fields: enforce a value ONLY when the
 * document is saved in the default locale (German). Other locales stay optional
 * and fall back to German on the website.
 *
 * Payload's built-in `required` is enforced per-locale, which would force
 * editors to also fill the English fields — these helpers avoid that.
 *
 * NOTE: Only use these on the localized page globals (PlatformPages,
 * LegalSettings). Project content is language-agnostic and is never localized,
 * so it has no default-locale concept.
 */

type ValidateReq = {
  locale?: string
  // Loosely typed so it accepts Payload's strict TFunction (literal-key union).
  t?: (key: any) => string
  payload?: { config?: { localization?: { defaultLocale?: string } | false } }
}

function isDefaultLocale(req?: ValidateReq): boolean {
  const localization = req?.payload?.config?.localization
  const defaultLocale = (localization && localization.defaultLocale) || 'de'
  return (req?.locale ?? defaultLocale) === defaultLocale
}

function requiredMessage(req?: ValidateReq): string {
  return req?.t?.('validation:required') ?? 'Dieses Feld ist erforderlich.'
}

/** Text / textarea — non-empty string required in the default locale. */
export const requiredTextInDefaultLocale = (value: unknown, { req }: { req?: ValidateReq }) =>
  !isDefaultLocale(req) || (typeof value === 'string' && value.trim() !== '') ? true : requiredMessage(req)

/** Rich text / any value — present (not null/undefined) in the default locale. */
export const requiredValueInDefaultLocale = (value: unknown, { req }: { req?: ValidateReq }) =>
  !isDefaultLocale(req) || (value !== null && value !== undefined && value !== '') ? true : requiredMessage(req)

/** Array — at least one row in the default locale. */
export const requiredArrayInDefaultLocale = (value: unknown, { req }: { req?: ValidateReq }) =>
  !isDefaultLocale(req) || (Array.isArray(value) && value.length > 0) ? true : requiredMessage(req)
