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
  zusammenarbeitOnBrand: '#ffffff',

  plattform:          '#007734',
  plattformLight:     '#f0f0f0',
  plattformInk:       '#555555',
  plattformInkAccent: 'rgb(28, 28, 28)',
  plattformAccent:    '#005828',
  plattformWhite:            '#ffffff',
  plattformWhiteTransparent: 'rgba(255, 255, 255, 0.7)',
  plattformBlack:            '#000000',
}