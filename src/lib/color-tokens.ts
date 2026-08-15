// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Pure platform color tokens — the single source of truth for the platform
 * palette defaults. Dependency-free on purpose: this module is imported by
 * client-side admin components (color picker / reset button) and must NOT
 * import `payload` (which pulls Node-only modules like `child_process`
 * into the client bundle). `src/lib/theme.ts` re-exports these and adds the
 * Payload-backed `getPlatformColors()` resolver.
 */

export interface PlatformColors {
  // Projekte
  projektesMain: string
  projektesLight: string
  projektesAccent: string
  projektesOnBrand: string
  projektesDark: string
  // Grundlagen
  grundlagenMain: string
  grundlagenLight: string
  grundlagenAccent: string
  grundlagenOnBrand: string
  grundlagenDark: string
  // Zusammenarbeit
  zusammenarbeitMain: string
  zusammenarbeitLight: string
  zusammenarbeitAccent: string
  zusammenarbeitOnBrand: string
  zusammenarbeitDark: string
  // Plattform
  plattform: string
  plattformLight: string
  plattformInk: string
  plattformInkAccent: string
  plattformAccent: string
  plattformWhite: string
  plattformWhiteTransparent: string
  plattformBlack: string
  // App (workspace) — duplicates of plattform tokens, editable in admin
  appBlack: string
  appInk: string
  appInkAccent: string
  appWhite: string
  appLight: string
  appAccent: string
}

export const COLOR_DEFAULTS: PlatformColors = {
  projektesMain:    '#ffdfab',
  projektesLight:   '#ffebc9',
  projektesAccent:  '#ff9c1a',
  projektesDark:    '#ffb950',
  projektesOnBrand: '#1c1c1c',

  // Role structure mirrors projekte: light/main = surfaces, dark = chip/ball
  // backgrounds (mid tone), accent = darkest tone for text accents.
  grundlagenMain:   '#d8d9ff',
  grundlagenLight:  '#eeeeff',
  grundlagenAccent: '#7375c4',
  grundlagenDark:   '#a0a2e8',
  grundlagenOnBrand: '#1c1c1c',

  zusammenarbeitMain:   '#b2deb7',
  zusammenarbeitLight:  '#dff2e1',
  zusammenarbeitAccent: '#3d9445',
  zusammenarbeitDark:   '#6dbf74',
  zusammenarbeitOnBrand: '#1c1c1c',

  plattform:          '#007734',
  plattformLight:     '#f0f0f0',
  plattformInk:       '#555555',
  plattformInkAccent: 'rgb(28, 28, 28)',
  plattformAccent:    '#005828',
  plattformWhite:            '#ffffff',
  plattformWhiteTransparent: 'rgba(255, 255, 255, 0.7)',
  plattformBlack:            '#000000',

  // App (workspace) — neutral black/white scheme, no "real" accent color
  appBlack:  '#000000',
  appInk:    '#555555',
  appInkAccent: '#1c1c1c',
  appWhite:  '#ffffff',
  appLight:  '#f0f0f0',
  appAccent: '#1c1c1c',
}