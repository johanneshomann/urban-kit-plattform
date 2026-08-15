// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

// Deliberately NOT 'server-only': the seed scripts (npx tsx) need this check
// too, and they run outside the React server bundle.

/**
 * True when a Lexical rich-text value contains something renderable.
 *
 * Payload's locale fallback only kicks in when a localized value is absent —
 * but once an editor opens a locale in the admin and saves, an EMPTY Lexical
 * document is stored, which counts as a value and defeats the fallback. Pages
 * use this check to fall back to `de` manually in that case; the legal seeder
 * uses it to treat saved-but-empty fields as still seedable.
 */
export function hasRichTextContent(value: unknown): boolean {
  const root = (value as { root?: { children?: unknown[] } } | null)?.root
  if (!root?.children?.length) return false
  const walk = (n: unknown): boolean => {
    const node = n as { type?: string; text?: string; children?: unknown[] }
    if (typeof node?.text === 'string' && node.text.trim() !== '') return true
    // Non-text nodes that still render something on their own.
    if (node?.type === 'upload' || node?.type === 'relationship' || node?.type === 'horizontalrule') return true
    return (node?.children ?? []).some(walk)
  }
  return root.children.some(walk)
}
