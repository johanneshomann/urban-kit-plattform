// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useEffect, useRef, useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { HeadingNode, QuoteNode, $createHeadingNode, $isHeadingNode } from '@lexical/rich-text'
import { ListNode, ListItemNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { LinkNode, $createLinkNode } from '@lexical/link'
import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'
import { AtSign, Bold, Italic, Heading2, List, ListOrdered, Loader2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** One insertable project-content reference (search result). */
export interface EditorReference {
  label: string
  /** Absolute href the inserted link points at. */
  href: string
  /** Secondary line (module name …). */
  meta?: string
}

/**
 * Minimal Lexical WYSIWYG for content popups, in the project color scheme.
 * Speaks SERIALIZED LEXICAL STATE on the wire (same shape Payload stores) —
 * no markdown round-trip. Toolbar: bold, italic, heading (toggles back to
 * paragraph), bullet/numbered list.
 */

function ToolbarButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // Preserve the editor selection: mousedown would blur the contentEditable
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className="p-1.5 rounded-md transition-colors cursor-pointer hover:bg-[color-mix(in_srgb,var(--project-general)_25%,transparent)]"
      style={{ color: 'var(--project-accent)' }}
    >
      <Icon aria-hidden className="w-4 h-4" />
    </button>
  )
}

/**
 * Search panel under the toolbar: find project content the viewer may see and
 * insert it as a link at the cursor. The search function comes from the host
 * (visibility scoping happens server-side there).
 */
function ReferencePanel({ search, onClose }: { search: (q: string) => Promise<EditorReference[]>; onClose: () => void }) {
  const [editor] = useLexicalComposerContext()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<EditorReference[]>([])
  const [busy, setBusy] = useState(false)
  const seqRef = useRef(0)

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) { setResults([]); setBusy(false); return }
    setBusy(true)
    const id = ++seqRef.current
    const t = setTimeout(async () => {
      const res = await search(query).catch(() => [] as EditorReference[])
      if (seqRef.current !== id) return
      setBusy(false)
      setResults(res)
    }, 250)
    return () => clearTimeout(t)
  }, [q, search])

  const insert = (r: EditorReference) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const link = $createLinkNode(r.href)
      link.append($createTextNode(r.label))
      selection.insertNodes([link, $createTextNode(' ')])
    })
    onClose()
    editor.focus()
  }

  return (
    <div className="px-2 py-2 border-b" style={{ borderColor: 'color-mix(in srgb, var(--project-general) 25%, transparent)', background: 'var(--project-light)' }}>
      <div className="flex items-center gap-2">
        {busy
          ? <Loader2 aria-hidden className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ color: 'var(--project-ink)' }} />
          : <AtSign aria-hidden className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--project-ink)' }} />}
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); editor.focus() } }}
          placeholder="Projektinhalt suchen und verlinken …"
          aria-label="Projektinhalt suchen und verlinken"
          className="flex-1 min-w-0 px-2 py-1 rounded-md border text-small outline-none"
          style={{ borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)', color: 'var(--project-accent)', background: 'var(--project-white)' }}
        />
        <button type="button" onClick={() => { onClose(); editor.focus() }} aria-label="Schließen" className="p-1 rounded-md cursor-pointer" style={{ color: 'var(--project-accent)' }}>
          <X aria-hidden className="w-3.5 h-3.5" />
        </button>
      </div>
      {results.length > 0 && (
        <ul className="mt-1.5 max-h-40 overflow-y-auto rounded-md border" style={{ borderColor: 'color-mix(in srgb, var(--project-general) 25%, transparent)', background: 'var(--project-white)' }}>
          {results.map((r) => (
            <li key={r.href + r.label}>
              <button
                type="button"
                onClick={() => insert(r)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-small cursor-pointer hover:bg-[color-mix(in_srgb,var(--project-general)_14%,transparent)]"
                style={{ color: 'var(--project-accent)' }}
              >
                <span className="truncate flex-1">{r.label}</span>
                {r.meta && <span className="truncate max-w-[35%] text-[0.75rem] opacity-70">{r.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && !busy && results.length === 0 && (
        <p className="mt-1.5 px-1 text-small" style={{ color: 'var(--project-ink)' }}>Keine Treffer.</p>
      )}
    </div>
  )
}

function Toolbar({ onToggleReferences, referencesOpen }: { onToggleReferences?: () => void; referencesOpen?: boolean }) {
  const [editor] = useLexicalComposerContext()

  const toggleHeading = () => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const block = selection.anchor.getNode().getTopLevelElementOrThrow()
      $setBlocksType(selection, () => ($isHeadingNode(block) ? $createParagraphNode() : $createHeadingNode('h2')))
    })
  }

  return (
    <div
      role="toolbar"
      aria-label="Textformatierung"
      className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b"
      style={{
        background: 'var(--project-light)',
        borderColor: 'color-mix(in srgb, var(--project-general) 25%, transparent)',
      }}
    >
      <ToolbarButton icon={Bold} label="Fett" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} />
      <ToolbarButton icon={Italic} label="Kursiv" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} />
      <span aria-hidden className="w-px h-4 mx-1" style={{ background: 'color-mix(in srgb, var(--project-general) 35%, transparent)' }} />
      <ToolbarButton icon={Heading2} label="Überschrift" onClick={toggleHeading} />
      <ToolbarButton icon={List} label="Aufzählung" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} />
      <ToolbarButton icon={ListOrdered} label="Nummerierte Liste" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} />
      {onToggleReferences && (
        <>
          <span aria-hidden className="w-px h-4 mx-1" style={{ background: 'color-mix(in srgb, var(--project-general) 35%, transparent)' }} />
          <button
            type="button"
            title="Projektinhalt verlinken"
            aria-label="Projektinhalt verlinken"
            aria-expanded={referencesOpen}
            onMouseDown={(e) => { e.preventDefault(); onToggleReferences() }}
            className="p-1.5 rounded-md transition-colors cursor-pointer hover:bg-[color-mix(in_srgb,var(--project-general)_25%,transparent)]"
            style={referencesOpen
              ? { background: 'var(--project-accent)', color: 'var(--project-white)' }
              : { color: 'var(--project-accent)' }}
          >
            <AtSign aria-hidden className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  )
}

export function RichTextEditor({ value, onChange, ariaLabel, minRows = 10, referenceSearch }: {
  /** Initial content: serialized Lexical editor state (Payload's storage shape); null/empty → empty editor. Read ONCE on mount — remount via `key` to reset. */
  value: string | null
  /** Fires with the serialized Lexical editor state. */
  onChange: (serializedState: string) => void
  ariaLabel: string
  minRows?: number
  /**
   * Enables the @-button: search project content and insert the pick as a
   * link at the cursor. The host supplies the (visibility-scoped) search.
   */
  referenceSearch?: (query: string) => Promise<EditorReference[]>
}) {
  const [refsOpen, setRefsOpen] = useState(false)
  const initialConfig = {
    namespace: 'uk-richtext',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
    onError: (e: Error) => console.error(e),
    editorState: value && value.trim() ? value : undefined,
    theme: {
      paragraph: 'mb-2',
      heading: { h2: 'text-display font-bold mt-3 mb-1.5', h3: 'text-text font-bold mt-2 mb-1' },
      list: { ul: 'list-disc pl-5 mb-2', ol: 'list-decimal pl-5 mb-2', listitem: 'mb-0.5' },
      text: { bold: 'font-bold', italic: 'italic' },
      link: 'underline',
    },
  }

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: 'color-mix(in srgb, var(--project-general) 30%, transparent)',
        background: 'var(--project-white)',
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar
          onToggleReferences={referenceSearch ? () => setRefsOpen((v) => !v) : undefined}
          referencesOpen={refsOpen}
        />
        {refsOpen && referenceSearch && (
          <ReferencePanel search={referenceSearch} onClose={() => setRefsOpen(false)} />
        )}
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              className="px-3 py-2 text-text outline-none overflow-y-auto"
              style={{ color: 'var(--project-accent)', minHeight: `${minRows * 1.5}rem`, maxHeight: '50vh' }}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin
          ignoreSelectionChange
          onChange={(state) => onChange(JSON.stringify(state.toJSON()))}
        />
      </LexicalComposer>
    </div>
  )
}
