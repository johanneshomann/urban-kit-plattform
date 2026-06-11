/** URL-safe slug from a German title (umlauts transliterated). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Slug plus a short time-based suffix — unique enough for content items. */
export function uniqueSlug(title: string, fallback: string): string {
  return `${slugify(title) || fallback}-${Date.now().toString(36)}`
}
