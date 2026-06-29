'use client'

import { useTranslations } from 'next-intl'
import { FeatureAccordion as SharedFeatureAccordion } from '@/components/public/FeatureAccordion'
import { STEP_FEATURES } from './starten-data'

export function FeatureAccordion({ stepIndex }: { stepIndex: number }) {
  const t = useTranslations('starten')
  const items = (STEP_FEATURES[stepIndex] ?? []).map((f) => ({
    icon: f.icon,
    title: t(f.titleKey),
    body: t(f.bodyKey),
  }))
  return (
    <SharedFeatureAccordion
      items={items}
      color="var(--plattform-ink)"
      hoverColor="var(--plattform-accent)"
    />
  )
}
