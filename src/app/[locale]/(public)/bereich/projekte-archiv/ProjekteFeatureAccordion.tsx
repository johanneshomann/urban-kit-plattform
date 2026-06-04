'use client'

import { FeatureAccordion } from '@/components/public/FeatureAccordion'
import { PROJEKTE_FEATURES } from './projekte-accordion-data'

export function ProjekteFeatureAccordion() {
  return (
    <FeatureAccordion
      items={PROJEKTE_FEATURES}
      color="var(--plattform-ink)"
      hoverColor="var(--projekte-dark)"
      cardBg="var(--plattform-white-transparent)"
    />
  )
}
