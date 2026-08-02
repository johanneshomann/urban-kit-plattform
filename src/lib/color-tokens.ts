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
  projektesDark: string
  // Grundlagen
  grundlagenMain: string
  grundlagenLight: string
  grundlagenAccent: string
  grundlagenDark: string
  // Zusammenarbeit
  zusammenarbeitMain: string
  zusammenarbeitLight: string
  zusammenarbeitAccent: string
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
}

export const COLOR_DEFAULTS: PlatformColors = {
  projektesMain:    '#ffd085',
  projektesLight:   '#ffe3b3',
  projektesAccent:  '#ffb347',
  projektesDark:    '#ff9c1a',

  grundlagenMain:   '#d8d9ff',
  grundlagenLight:  '#eeeeff',
  grundlagenAccent: '#a0a2e8',
  grundlagenDark:   '#7375c4',

  zusammenarbeitMain:   '#b2deb7',
  zusammenarbeitLight:  '#dff2e1',
  zusammenarbeitAccent: '#6dbf74',
  zusammenarbeitDark:   '#3d9445',

  plattform:          '#007734',
  plattformLight:     '#f0f0f0',
  plattformInk:       '#555555',
  plattformInkAccent: 'rgb(28, 28, 28)',
  plattformAccent:    '#005828',
  plattformWhite:            '#ffffff',
  plattformWhiteTransparent: 'rgba(255, 255, 255, 0.7)',
  plattformBlack:            '#000000',
}