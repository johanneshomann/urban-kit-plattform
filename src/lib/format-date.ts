/**
 * "Heute"/"Gestern" (localized) for today/yesterday, otherwise a short absolute
 * date like "29. Jun". Used by dashboard cards and the recent-activity feed.
 */
export function relativeDay(iso: string, locale: string): string {
  const d = new Date(iso)
  const dayMs = 86_400_000
  const startOf = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())
  const diff = Math.round((startOf(new Date()) - startOf(d)) / dayMs)
  if (diff === 0 || diff === 1) {
    const rel = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-diff, 'day')
    return rel.charAt(0).toUpperCase() + rel.slice(1)
  }
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

/** Whole days from now until `iso` (never negative). */
export function daysUntil(iso: string): number {
  const dayMs = 86_400_000
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / dayMs))
}
