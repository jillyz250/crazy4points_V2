import { GUIDES } from '@/lib/guides'

/**
 * Freshness signal for guide pages. Reads the guide's `updated` date from the
 * central registry (lib/guides.ts) by slug and renders a small "Updated {date}"
 * line under the title. Single source of truth: update the date in guides.ts,
 * not in the page. Renders nothing if the guide (or its date) isn't found.
 */
export function GuideDateline({ slug }: { slug: string }) {
  const g = GUIDES.find((x) => x.slug === slug)
  if (!g?.updated) return null
  const d = new Date(`${g.updated}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return (
    <p className="mt-3 font-ui text-sm text-[var(--color-text-secondary)]">
      Updated {d}
    </p>
  )
}
