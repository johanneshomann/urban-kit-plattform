'use client'

import { FeatureAccordion as SharedFeatureAccordion } from '@/components/public/FeatureAccordion'
import { STEP_FEATURES } from './starten-data'

export function FeatureAccordion({ stepIndex }: { stepIndex: number }) {
  return (
    <SharedFeatureAccordion
      items={STEP_FEATURES[stepIndex] ?? []}
      color="var(--plattform-ink)"
      hoverColor="var(--plattform-accent)"
    />
  )
}
