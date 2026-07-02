'use client'

import { useTranslations } from 'next-intl'
import { FeatureAccordion } from '@/components/public/FeatureAccordion'
import { PROJEKTE_FEATURES } from './projekte-accordion-data'

export function ProjekteFeatureAccordion() {
  const t = useTranslations('projekteArchiv')
  const items = PROJEKTE_FEATURES.map((f) => ({ icon: f.icon, title: t(f.titleKey), body: t(f.bodyKey) }))
  return (
    <FeatureAccordion
      items={items}
      color="var(--projekte-dark)"
      cardBg="white"
    />
  )
}
