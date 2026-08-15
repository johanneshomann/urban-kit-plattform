// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

export type ColorScheme = {
  name: string
  light: string
  general: string
  dark: string
  accent: string
  ink: string
  white: string
  black: string
}

/**
 * Project colour schemes. Same role structure as the Bereich palettes in
 * `src/lib/color-tokens.ts`, so a project palette and a Bereich palette are
 * interchangeable:
 *
 *   `light`   → page / section background (Bereich: `light`)
 *   `general` → pastel brand surface      (Bereich: `main`)
 *   `dark`    → chip / badge surface, one step deeper than `general`
 *   `accent`  → darkest tone of the same hue: body text, links, solid buttons
 *   `ink`     → desaturated body copy, the project-side `--plattform-ink`
 *   `black`   → headings, and text on `general` / `dark` (Bereich: `on-brand`)
 *   `white`   → near-white surface, and text on `accent`
 *
 * Which pairings are allowed follows from the contrast, not from taste:
 *
 *   text on a surface   → `accent`, `ink` or `black` on `white`/`light`/`general`
 *   text on a chip      → `black` on `dark` (4.92:1 worst case)
 *   text on a button    → `white` on `accent` (7.27:1 worst case)
 *
 * `white` on `dark` is NOT one of them — it tops out at 2.9:1. `dark` is a
 * mid-tone; it carries dark text or no text at all. That pairing was the
 * AA failure this palette structure replaced.
 *
 * Keep it that way: `.claude/plan/project-color-tokens.md` documents the gate,
 * and the roles above only hold if the contrast does.
 */
export const defaultColorSchemes: ColorScheme[] = [
  {
    name: 'Sandstein',
    light:   '#faf0e4',
    general: '#e4c9a0',
    dark:    '#ad804f',
    accent:  '#6d5032',
    ink:     '#5f554a',
    white:   '#fffdf9',
    black:   '#2e1a08',
  },
  {
    name: 'Terrakotta',
    light:   '#faeae4',
    general: '#d97a5a',
    dark:    '#cb6f52',
    accent:  '#4b2012',
    ink:     '#392924',
    white:   '#fffaf8',
    black:   '#2e1208',
  },
  {
    name: 'Kupfer',
    light:   '#faf0e6',
    general: '#d49a6a',
    dark:    '#b97844',
    accent:  '#55351b',
    ink:     '#453930',
    white:   '#fffcf8',
    black:   '#241408',
  },
  {
    name: 'Feldgrau',
    light:   '#eef3e8',
    general: '#8da87a',
    dark:    '#759267',
    accent:  '#2e3b28',
    ink:     '#343931',
    white:   '#fafdf8',
    black:   '#181e10',
  },
  {
    name: 'Ozean',
    light:   '#e4f5f5',
    general: '#4aadad',
    dark:    '#399292',
    accent:  '#123b3b',
    ink:     '#293939',
    white:   '#f8fdfd',
    black:   '#061818',
  },
  {
    name: 'Schiefer',
    light:   '#e9eff6',
    general: '#96b1c9',
    dark:    '#7191ac',
    accent:  '#1e3a52',
    ink:     '#2f3944',
    white:   '#f8fbfe',
    black:   '#0b1722',
  },
  {
    name: 'Pflaume',
    light:   '#f2ebf4',
    general: '#b795c0',
    dark:    '#a07ba9',
    accent:  '#43264c',
    ink:     '#3a3140',
    white:   '#fcf9fd',
    black:   '#1d0d22',
  },
  {
    name: 'Altrosa',
    light:   '#f9ecee',
    general: '#d59aa4',
    dark:    '#bb7580',
    accent:  '#5d2430',
    ink:     '#413336',
    white:   '#fdf9fa',
    black:   '#270910',
  },
]
