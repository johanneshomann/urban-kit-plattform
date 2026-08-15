// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

'use client'

import { useTranslations } from 'next-intl'
import { FeatureAccordion as SharedFeatureAccordion } from '@/components/public/FeatureAccordion'
import { STEP_FEATURES } from './starten-data'

export function FeatureAccordion({ stepIndex, cardBg }: { stepIndex: number; cardBg?: string }) {
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
      cardBg={cardBg}
      bordered={false}
    />
  )
}
