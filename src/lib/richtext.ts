import 'server-only'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  editorConfigFactory,
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
} from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from 'lexical'
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical'

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
  if (!data || typeof data !== 'object') return ''
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
