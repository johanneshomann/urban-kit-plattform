'use client'

import { useForm, useTranslation } from '@payloadcms/ui'
import { COLOR_DEFAULTS } from '@/lib/color-tokens'
import type { PlatformColors } from '@/lib/color-tokens'

/**
 * Resets every color field in Platform Settings back to COLOR_DEFAULTS.
 * The change still needs to be saved — this only updates the form state.
 */
const RESETS: Record<keyof PlatformColors, string> = {
  projektesMain: COLOR_DEFAULTS.projektesMain,
  projektesLight: COLOR_DEFAULTS.projektesLight,
  projektesAccent: COLOR_DEFAULTS.projektesAccent,
  projektesDark: COLOR_DEFAULTS.projektesDark,
  projektesOnBrand: COLOR_DEFAULTS.projektesOnBrand,
  grundlagenMain: COLOR_DEFAULTS.grundlagenMain,
  grundlagenLight: COLOR_DEFAULTS.grundlagenLight,
  grundlagenAccent: COLOR_DEFAULTS.grundlagenAccent,
  grundlagenDark: COLOR_DEFAULTS.grundlagenDark,
  grundlagenOnBrand: COLOR_DEFAULTS.grundlagenOnBrand,
  zusammenarbeitMain: COLOR_DEFAULTS.zusammenarbeitMain,
  zusammenarbeitLight: COLOR_DEFAULTS.zusammenarbeitLight,
  zusammenarbeitAccent: COLOR_DEFAULTS.zusammenarbeitAccent,
  zusammenarbeitDark: COLOR_DEFAULTS.zusammenarbeitDark,
  zusammenarbeitOnBrand: COLOR_DEFAULTS.zusammenarbeitOnBrand,
  plattform: COLOR_DEFAULTS.plattform,
  plattformLight: COLOR_DEFAULTS.plattformLight,
  plattformInk: COLOR_DEFAULTS.plattformInk,
  plattformInkAccent: COLOR_DEFAULTS.plattformInkAccent,
  plattformAccent: COLOR_DEFAULTS.plattformAccent,
  plattformWhite: COLOR_DEFAULTS.plattformWhite,
  plattformWhiteTransparent: COLOR_DEFAULTS.plattformWhiteTransparent,
  plattformBlack: COLOR_DEFAULTS.plattformBlack,

  appBlack:     COLOR_DEFAULTS.appBlack,
  appInk:       COLOR_DEFAULTS.appInk,
  appInkAccent: COLOR_DEFAULTS.appInkAccent,
  appWhite:     COLOR_DEFAULTS.appWhite,
  appLight:     COLOR_DEFAULTS.appLight,
  appAccent:    COLOR_DEFAULTS.appAccent,
}

export function ColorResetButton() {
  const { dispatchFields, setModified } = useForm()
  const { i18n } = useTranslation()
  const de = i18n.language?.startsWith('de')

  const onReset = () => {
    for (const [path, value] of Object.entries(RESETS)) {
      dispatchFields({ type: 'UPDATE', path, value })
    }
    setModified(true)
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={onReset}>
        {de ? 'Auf Standardfarben zurücksetzen' : 'Reset to default colors'}
      </button>
    </div>
  )
}