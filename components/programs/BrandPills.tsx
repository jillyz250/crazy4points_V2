'use client'

import { useState } from 'react'
import { getHotelBrands, hotelBrandCount } from '@/lib/hotelBrands'

/**
 * Brand portfolio pills for a hotel program page, grouped by segment.
 * Renders nothing if the program has no brand data yet (see lib/hotelBrands.ts).
 * Mirrors the airline-alliance operator pills, but grouped so a big portfolio
 * (Accor has ~42 brands) reads as a map instead of a wall.
 *
 * Big portfolios collapse to the first two segments with a "Show all" toggle so
 * they don't push content down on mobile. Every brand stays in the DOM (hidden
 * via CSS, not unmounted) so the names remain crawlable for SEO.
 */
const COLLAPSE_THRESHOLD = 16
/** Segments always shown when collapsed (the aspirational top of the portfolio). */
const PREVIEW_SEGMENTS = 2

export default function BrandPills({ slug, programName }: { slug: string; programName: string }) {
  const segments = getHotelBrands(slug)
  const count = hotelBrandCount(slug)
  const [expanded, setExpanded] = useState(false)

  if (!segments.length) return null
  const collapsible = count > COLLAPSE_THRESHOLD && segments.length > PREVIEW_SEGMENTS

  return (
    <section aria-label={`${programName} brands`} className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-display text-lg font-semibold text-[var(--color-primary)] md:text-xl">
          The {programName} portfolio
        </h2>
        <span className="font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
          {count} brands
        </span>
      </div>
      <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
        Every brand below earns and redeems in this one program.
      </p>

      <div className="mt-4 flex flex-col gap-3.5">
        {segments.map((seg, i) => {
          const hidden = collapsible && !expanded && i >= PREVIEW_SEGMENTS
          return (
            <div key={seg.segment} className={hidden ? 'hidden' : undefined}>
              <span className="font-ui text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                {seg.segment}
              </span>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {seg.brands.map((b) => (
                  <li
                    key={b}
                    className="rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background)] px-2.5 py-1 font-ui text-[0.8125rem] font-medium text-[var(--color-text-primary)]"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-4 inline-flex items-center gap-1 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          {expanded ? 'Show fewer' : `Show all ${count} brands`}
          <span aria-hidden className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}>
            &darr;
          </span>
        </button>
      )}
    </section>
  )
}
