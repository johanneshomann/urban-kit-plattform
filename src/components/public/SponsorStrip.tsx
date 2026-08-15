import type { Sponsor } from '@/lib/sponsors'

/**
 * Centered flex-wrap strip of partner logos (footer + Über-UrbanKIT page).
 * Partner names are intentionally not rendered as visible text — the name is
 * the accessible name (aria-label) of the link/wrapper and doubles as the
 * hover tooltip via title. Per-logo height/padding come from the admin.
 */
export function SponsorStrip({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 list-none p-0 m-0">
      {sponsors.map((sponsor, i) => {
        const img = (
          // eslint-disable-next-line @next/next/no-img-element -- CMS uploads have no known dimensions; fixed CSS height, natural width
          <img
            src={sponsor.logoUrl}
            alt={sponsor.alt}
            loading="lazy"
            className="w-auto max-w-full object-contain"
            style={{ height: `${sponsor.height}px` }}
          />
        )
        return (
          <li
            key={`${sponsor.name}-${i}`}
            style={{
              paddingTop: sponsor.padTop,
              paddingRight: sponsor.padRight,
              paddingBottom: sponsor.padBottom,
              paddingLeft: sponsor.padLeft,
            }}
          >
            {sponsor.url ? (
              <a
                href={sponsor.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label={sponsor.name}
                title={sponsor.name}
                className="block transition-opacity hover:opacity-70"
              >
                {img}
              </a>
            ) : (
              <span role="img" aria-label={sponsor.name} title={sponsor.name} className="block">
                {img}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
