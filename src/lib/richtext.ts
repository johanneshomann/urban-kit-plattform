import 'server-only'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  editorConfigFactory,
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
} from '@payloadcms/richtext-lexical'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from 'lexical'
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical'

/** Has a non-empty Lexical root (the converters throw on empty/rootless states). */
function hasContent(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const root = (data as { root?: { children?: unknown } }).root
  return !!root && Array.isArray(root.children) && root.children.length > 0
}

/** Lexical → HTML, safe for empty/malformed content (returns null). */
export function lexicalToHtml(data: unknown): string | null {
  if (!hasContent(data)) return null
  try {
    return convertLexicalToHTML({ data: data as Parameters<typeof convertLexicalToHTML>[0]['data'] })
  } catch {
    return null
  }
}

/**
 * Bridge between the Lexical richText stored on projects and a plain markdown
 * string the manage UI can edit in a textarea. Uses the project's default
 * editor config so headings/bold/lists round-trip.
 */

let _editorConfig: Promise<SanitizedServerEditorConfig> | null = null
async function getEditorConfig(): Promise<SanitizedServerEditorConfig> {
  if (!_editorConfig) {
    _editorConfig = (async () => {
      const payload = await getPayload({ config })
      return editorConfigFactory.default({ config: payload.config })
    })().catch((err) => {
      _editorConfig = null
      throw err
    })
  }
  return _editorConfig
}

export async function lexicalToMarkdown(data: unknown): Promise<string> {
  // Guard against empty/malformed editor states — the converter throws on a
  // missing or childless root ("the editor state is empty").
  if (!hasContent(data)) return ''
  try {
    const editorConfig = await getEditorConfig()
    return convertLexicalToMarkdown({ data: data as SerializedEditorState, editorConfig })
  } catch {
    return ''
  }
}

export async function markdownToLexical(markdown: string): Promise<SerializedEditorState> {
  const editorConfig = await getEditorConfig()
  return convertMarkdownToLexical({ editorConfig, markdown: markdown ?? '' }) as SerializedEditorState
}
