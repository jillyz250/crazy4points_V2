import { GUIDES } from '@/lib/guides'
import { SITE_URL } from '@/lib/constants'
import { safeJsonLd } from '@/lib/jsonLd'

/**
 * Article JSON-LD for a guide page. Reads everything (title, description,
 * updated date) from the central registry (lib/guides.ts) by slug, so the
 * page only passes its slug — single source of truth, same as GuideDateline.
 *
 * publisher references the site-wide Organization (@id set in app/layout.tsx)
 * so guides tie back to one verified brand entity. `updated` is an authored
 * verification date (not a publish date), so it maps to dateModified only.
 * Renders nothing if the guide isn't found in the registry.
 */
export function GuideJsonLd({ slug }: { slug: string }) {
  const g = GUIDES.find((x) => x.slug === slug)
  if (!g) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.description,
    ...(g.updated ? { dateModified: g.updated } : {}),
    author: { '@type': 'Organization', name: 'crazy4points' },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}/guides/${g.slug}`,
    url: `${SITE_URL}/guides/${g.slug}`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  )
}
