// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

import { getCitySettings } from '@/lib/instance'

/**
 * Admin wordmark (login screen): the same "UrbanKIT – <city>" lockup as the
 * app's login page, with the city logo from Platform Settings above it when
 * one is uploaded. Colours come from Payload's theme variables so light and
 * dark mode both work.
 */
export async function BrandLogo() {
  const { cityName, cityLogoUrl } = await getCitySettings()
  return (
    <div className="uk-admin-brand">
      {cityLogoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cityLogoUrl} alt={cityName} className="uk-admin-brand__logo" />
      )}
      <p className="uk-admin-brand__wordmark">
        <span>Urban</span><strong>KIT</strong>
        <span className="uk-admin-brand__city"> – {cityName}</span>
      </p>
    </div>
  )
}

/** Compact mark for the nav header / collapsed states. */
export function BrandIcon() {
  return <span className="uk-admin-icon" aria-label="UrbanKIT">U</span>
}
