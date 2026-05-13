import Link from 'next/link'
import type { PromoReward } from '@/utils/supabase/promoQueries'
import {
  getRegionForCity,
  REGION_LABEL,
  REGION_ORDER,
  type PromoRegion,
} from '@/lib/cityRegions'

/**
 * Public "Active Promos" section on /programs/[slug]. Treatment is a
 * data-terminal table — high information density, tabular numerals,
 * gold accents as connectors (not fills).
 *
 * Filter + sort state lives in URL params (?region, ?cabin, ?sort) so
 * results are deep-linkable, server-renderable, and AI/LLM citable.
 *
 * Per 2026-05-13 design audit:
 *   - Drop regional buckets. Flat table reads faster.
 *   - Miles column is the visual anchor: Playfair Display tabular nums
 *     in purple.
 *   - Gold appears as a CONNECTOR (the → between origin/dest) and as
 *     an URGENCY MARKER (left-border on rows expiring within 14 days).
 *   - Heavy 2px black header rule — single instance on the page.
 *   - No zebra striping; soft purple hover only.
 *
 * Cardinal rule: only renders rows where admin_status='published'
 * AND last_seen_active=true (enforced upstream in
 * getActivePromosForProgram).
 */

export type PromoSort = 'cheapest' | 'biggest_discount' | 'soonest_expiry' | 'region'

interface Props {
  promos: PromoReward[]
  programName: string
  programChartUrl?: string | null
  programSlug: string
  /** Current filter+sort state from URL search params */
  region: PromoRegion | 'all'
  cabin: string | 'all'
  sort: PromoSort
}

export default function ActivePromosSection({
  promos,
  programName,
  programChartUrl,
  programSlug,
  region,
  cabin,
  sort,
}: Props) {
  if (promos.length === 0) return null

  // Available regions + cabins drawn from the actual data (no
  // hardcoding — chips appear only when there's something to filter)
  const regionsPresent = new Set<PromoRegion>()
  const cabinsPresent = new Set<string>()
  for (const p of promos) {
    regionsPresent.add(getRegionForCity(p.dest_label ?? p.dest_iata))
    if (p.cabin) cabinsPresent.add(p.cabin)
  }
  const availableRegions = REGION_ORDER.filter((r) => regionsPresent.has(r))
  const availableCabins = Array.from(cabinsPresent).sort(cabinSortOrder)

  // Apply filters
  const filtered = promos.filter((p) => {
    if (region !== 'all' && getRegionForCity(p.dest_label ?? p.dest_iata) !== region) {
      return false
    }
    if (cabin !== 'all' && p.cabin !== cabin) return false
    return true
  })

  // Apply sort
  const sorted = sortPromos(filtered, sort)

  // Section-wide verified timestamp (newest scrape across all rows)
  const newestScrape = promos.reduce((max, p) => {
    const d = new Date(p.last_scraped_at).getTime()
    return d > max ? d : max
  }, 0)
  const hoursSinceScrape = (Date.now() - newestScrape) / (1000 * 60 * 60)
  const isStale = hoursSinceScrape > 48

  // Build href helpers
  const buildHref = (overrides: Partial<{ region: string; cabin: string; sort: PromoSort }>) => {
    const params = new URLSearchParams()
    const r = overrides.region ?? region
    const c = overrides.cabin ?? cabin
    const s = overrides.sort ?? sort
    if (r !== 'all') params.set('region', r)
    if (c !== 'all') params.set('cabin', c)
    if (s !== 'cheapest') params.set('sort', s)
    const qs = params.toString()
    return `/programs/${programSlug}${qs ? `?${qs}` : ''}#active-promos`
  }

  return (
    <section
      id="active-promos"
      style={{
        marginBottom: '5rem',
        scrollMarginTop: '2rem',
      }}
    >
      {/* Eyebrow + 48px gold rule rhymes with Live Now ───────────────── */}
      <div
        aria-hidden
        style={{
          width: '48px',
          height: '2px',
          background: 'var(--color-accent)',
          marginBottom: '0.625rem',
        }}
      />
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-primary)',
          margin: 0,
        }}
      >
        Active promos · {promos.length} routes
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0.25rem 0 0.5rem',
          lineHeight: 1.2,
        }}
      >
        Live promotional awards
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          fontStyle: 'italic',
          color: 'var(--color-text-secondary)',
          margin: '0 0 0.5rem',
          lineHeight: 1.5,
          maxWidth: '60ch',
        }}
      >
        Scraped directly from {programName}. Rotates monthly.
        {programChartUrl && (
          <>
            {' '}
            <a
              href={programChartUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontStyle: 'normal',
              }}
            >
              View {programName}&apos;s official rates →
            </a>
          </>
        )}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isStale ? '#92400E' : 'var(--color-text-secondary)',
          margin: '0 0 1.5rem',
        }}
      >
        Verified{' '}
        {new Date(newestScrape).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
        {isStale && ' — data may be stale'}
      </p>

      {/* Filter + sort bar ───────────────────────────────────────────── */}
      <FilterBar
        availableRegions={availableRegions}
        availableCabins={availableCabins}
        region={region}
        cabin={cabin}
        sort={sort}
        buildHref={buildHref}
      />

      {/* Table ───────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <EmptyState
          regionLabel={region === 'all' ? null : REGION_LABEL[region as PromoRegion]}
          clearHref={`/programs/${programSlug}#active-promos`}
        />
      ) : (
        <PromosTable promos={sorted} sort={sort} buildHref={buildHref} />
      )}
    </section>
  )
}

// ── Filter bar ─────────────────────────────────────────────────────

function FilterBar({
  availableRegions,
  availableCabins,
  region,
  cabin,
  sort,
  buildHref,
}: {
  availableRegions: PromoRegion[]
  availableCabins: string[]
  region: PromoRegion | 'all'
  cabin: string | 'all'
  sort: PromoSort
  buildHref: (
    overrides: Partial<{ region: string; cabin: string; sort: PromoSort }>,
  ) => string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem 1rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--color-border-soft)',
      }}
    >
      {/* Region chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        <Chip label="All regions" active={region === 'all'} href={buildHref({ region: 'all' })} />
        {availableRegions.map((r) => (
          <Chip
            key={r}
            label={REGION_LABEL[r]}
            active={region === r}
            href={buildHref({ region: r })}
          />
        ))}
      </div>

      {/* Cabin chips */}
      {availableCabins.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
            paddingLeft: '0.75rem',
            borderLeft: '1px solid var(--color-border-soft)',
          }}
        >
          <Chip label="All cabins" active={cabin === 'all'} href={buildHref({ cabin: 'all' })} />
          {availableCabins.map((c) => (
            <Chip
              key={c}
              label={c}
              active={cabin === c}
              href={buildHref({ cabin: c })}
            />
          ))}
        </div>
      )}

      {/* Sort */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.625rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            fontWeight: 700,
          }}
        >
          Sort by
        </span>
        <SortLink label="Cheapest" value="cheapest" active={sort === 'cheapest'} buildHref={buildHref} />
        <SortLink label="Biggest discount" value="biggest_discount" active={sort === 'biggest_discount'} buildHref={buildHref} />
        <SortLink label="Soonest expiry" value="soonest_expiry" active={sort === 'soonest_expiry'} buildHref={buildHref} />
        <SortLink label="By region" value="region" active={sort === 'region'} buildHref={buildHref} />
      </div>
    </div>
  )
}

function Chip({
  label,
  active,
  href,
}: {
  label: string
  active: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      scroll={false}
      style={{
        display: 'inline-block',
        padding: '0.4375rem 0.875rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.6875rem',
        fontWeight: active ? 700 : 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        background: active ? 'var(--color-primary)' : 'transparent',
        color: active ? '#FFFFFF' : 'var(--color-text-secondary)',
        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
        borderRadius: '999px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Link>
  )
}

function SortLink({
  label,
  value,
  active,
  buildHref,
}: {
  label: string
  value: PromoSort
  active: boolean
  buildHref: (
    overrides: Partial<{ region: string; cabin: string; sort: PromoSort }>,
  ) => string
}) {
  return (
    <Link
      href={buildHref({ sort: value })}
      scroll={false}
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        textDecoration: active ? 'underline' : 'none',
        textUnderlineOffset: '0.25em',
        textDecorationColor: 'var(--color-accent)',
        textDecorationThickness: '2px',
      }}
    >
      {label}
    </Link>
  )
}

// ── Table ──────────────────────────────────────────────────────────

function PromosTable({
  promos,
  sort,
  buildHref,
}: {
  promos: PromoReward[]
  sort: PromoSort
  buildHref: (
    overrides: Partial<{ region: string; cabin: string; sort: PromoSort }>,
  ) => string
}) {
  return (
    <table
      className="rg-promos-table"
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontVariantNumeric: 'tabular-nums',
        marginTop: '0.5rem',
      }}
    >
      <thead>
        <tr>
          <Th label="Route" sortValue="region" sort={sort} buildHref={buildHref} align="left" width="40%" />
          <Th label="Cabin" align="left" width="14%" />
          <Th label="Miles" sortValue="cheapest" sort={sort} buildHref={buildHref} align="right" width="16%" />
          <Th label="Off" sortValue="biggest_discount" sort={sort} buildHref={buildHref} align="right" width="10%" />
          <Th label="Valid" sortValue="soonest_expiry" sort={sort} buildHref={buildHref} align="left" width="20%" />
        </tr>
      </thead>
      <tbody>
        {promos.map((p) => (
          <Row key={p.id} promo={p} />
        ))}
      </tbody>
    </table>
  )
}

function Th({
  label,
  sortValue,
  sort,
  buildHref,
  align,
  width,
}: {
  label: string
  sortValue?: PromoSort
  sort?: PromoSort
  buildHref?: (
    overrides: Partial<{ region: string; cabin: string; sort: PromoSort }>,
  ) => string
  align: 'left' | 'right'
  width: string
}) {
  const isActive = sortValue != null && sort === sortValue
  return (
    <th
      style={{
        textAlign: align,
        padding: '0.875rem 1rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        borderBottom: '2px solid #1A1A1A',
        width,
        whiteSpace: 'nowrap',
      }}
    >
      {sortValue && buildHref ? (
        <Link
          href={buildHref({ sort: sortValue })}
          scroll={false}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {label}
          {isActive && <span style={{ marginLeft: '0.25em' }}>↑</span>}
        </Link>
      ) : (
        label
      )}
    </th>
  )
}

function Row({ promo }: { promo: PromoReward }) {
  const origin = promo.origin_label ?? promo.origin_iata ?? '—'
  const dest = promo.dest_label ?? promo.dest_iata ?? '—'
  const discount = promo.intel_discount_percent
  const isHighDiscount = discount != null && discount >= 30

  const daysToExpiry = promo.valid_to
    ? Math.ceil((new Date(promo.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const isUrgent = daysToExpiry != null && daysToExpiry > 0 && daysToExpiry <= 14

  return (
    <tr
      className="rg-promos-row"
      style={{
        borderBottom: '1px solid #F0EAF5',
      }}
    >
      <td
        style={{
          padding: '1rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          color: 'var(--color-text-primary)',
          borderLeft: isUrgent ? '2px solid var(--color-accent)' : '2px solid transparent',
          paddingLeft: isUrgent ? 'calc(1rem - 2px)' : '1rem',
        }}
      >
        {origin}
        {' '}
        <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>→</span>
        {' '}
        {dest}
      </td>
      <td
        style={{
          padding: '1rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          fontWeight: 600,
        }}
      >
        {promo.cabin ?? '—'}
      </td>
      <td
        style={{
          padding: '1rem',
          textAlign: 'right',
          fontFamily: 'var(--font-display)',
          fontSize: '1.0625rem',
          fontWeight: 600,
          color: 'var(--color-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {promo.points_required?.toLocaleString() ?? '—'}
      </td>
      <td
        style={{
          padding: '1rem',
          textAlign: 'right',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: isHighDiscount ? 'var(--color-accent-hover)' : 'var(--color-text-secondary)',
          fontWeight: isHighDiscount ? 700 : 500,
        }}
      >
        {discount != null ? `${Math.round(discount)}%` : '—'}
      </td>
      <td
        style={{
          padding: '1rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: isUrgent ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          fontWeight: isUrgent ? 600 : 400,
        }}
      >
        {promo.valid_to ? formatValid(promo.valid_to) : '—'}
      </td>
    </tr>
  )
}

function EmptyState({
  regionLabel,
  clearHref,
}: {
  regionLabel: string | null
  clearHref: string
}) {
  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '1.375rem',
          color: 'var(--color-text-secondary)',
          margin: '0 0 0.5rem',
        }}
      >
        No routes match those filters.
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}
      >
        {regionLabel
          ? `No active promos to ${regionLabel.toLowerCase()} right now. `
          : ''}
        <Link
          href={clearHref}
          style={{
            color: 'var(--color-primary)',
            fontWeight: 600,
            textDecoration: 'underline',
            textDecorationColor: 'var(--color-accent)',
          }}
        >
          Clear filters
        </Link>
      </p>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function sortPromos(promos: PromoReward[], sort: PromoSort): PromoReward[] {
  const sorted = [...promos]
  switch (sort) {
    case 'cheapest':
      return sorted.sort(
        (a, b) => (a.points_required ?? Infinity) - (b.points_required ?? Infinity),
      )
    case 'biggest_discount':
      return sorted.sort(
        (a, b) => (b.intel_discount_percent ?? 0) - (a.intel_discount_percent ?? 0),
      )
    case 'soonest_expiry':
      return sorted.sort((a, b) => {
        const at = a.valid_to ? new Date(a.valid_to).getTime() : Infinity
        const bt = b.valid_to ? new Date(b.valid_to).getTime() : Infinity
        return at - bt
      })
    case 'region':
      return sorted.sort((a, b) => {
        const ra = REGION_ORDER.indexOf(getRegionForCity(a.dest_label ?? a.dest_iata))
        const rb = REGION_ORDER.indexOf(getRegionForCity(b.dest_label ?? b.dest_iata))
        if (ra !== rb) return ra - rb
        return (a.points_required ?? Infinity) - (b.points_required ?? Infinity)
      })
  }
}

function cabinSortOrder(a: string, b: string): number {
  const order = ['Economy', 'Premium', 'Premium Economy', 'Business', 'First']
  const ia = order.indexOf(a)
  const ib = order.indexOf(b)
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
}

function formatValid(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
