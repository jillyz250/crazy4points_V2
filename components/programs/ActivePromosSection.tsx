import type { PromoReward } from '@/utils/supabase/promoQueries'
import {
  getRegionForCity,
  REGION_LABEL,
  REGION_ORDER,
  type PromoRegion,
} from '@/lib/cityRegions'

/**
 * Public "Active Promos" section on /programs/[slug]. Renders published
 * promo_rewards rows scraped from the program's own site, organized into
 * regional buckets to keep N=41+ rows scannable.
 *
 * Design (2026-05-13 FE audit):
 *   - "Promo Picks · Curator's Shortlist" — Top 3 cheapest as cream
 *     tiles with gold hairline borders
 *   - Regional buckets below as bordered cards, each with collapsed
 *     <details> revealing the per-route list
 *   - Section eyebrow + 48px gold rule (visual rhyme with Live Now)
 *
 * Cardinal rule from plans/promo-scraper.md: only renders rows where
 * admin_status='published' AND last_seen_active=true (enforced in
 * getActivePromosForProgram query).
 */
export default function ActivePromosSection({
  promos,
  programName,
  programChartUrl,
}: {
  promos: PromoReward[]
  programName: string
  programChartUrl?: string | null
}) {
  if (promos.length === 0) return null

  // Top 3 picks — cheapest by points_required. Ties broken by
  // last_scraped_at (newest first) so a recently-refreshed promo
  // surfaces ahead of a stale one at the same price.
  const top3 = [...promos]
    .filter((p) => p.points_required != null)
    .sort((a, b) => {
      const pa = a.points_required ?? Infinity
      const pb = b.points_required ?? Infinity
      if (pa !== pb) return pa - pb
      return new Date(b.last_scraped_at).getTime() - new Date(a.last_scraped_at).getTime()
    })
    .slice(0, 3)

  // Bucket all promos by region (using destination city → region lookup)
  const buckets = new Map<PromoRegion, PromoReward[]>()
  for (const p of promos) {
    const region = getRegionForCity(p.dest_label ?? p.dest_iata)
    const arr = buckets.get(region) ?? []
    arr.push(p)
    buckets.set(region, arr)
  }

  const sortedBuckets = REGION_ORDER
    .filter((r) => buckets.has(r))
    .map((r) => [r, buckets.get(r)!] as const)

  // Section-wide verified timestamp (newest scrape across all rows)
  const newestScrape = promos.reduce((max, p) => {
    const d = new Date(p.last_scraped_at).getTime()
    return d > max ? d : max
  }, 0)
  const hoursSinceScrape = (Date.now() - newestScrape) / (1000 * 60 * 60)
  const isStale = hoursSinceScrape > 48

  return (
    <section
      id="active-promos"
      style={{
        marginBottom: '5rem',
        scrollMarginTop: '2rem',
      }}
    >
      {/* Section header — gold rule rhymes with Live Now ────────────── */}
      <div
        aria-hidden
        style={{
          width: '48px',
          height: '2px',
          background: 'var(--color-accent)',
          marginBottom: '0.625rem',
        }}
      />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
          fontWeight: 700,
          color: 'var(--color-primary)',
          margin: '0 0 0.25rem',
          lineHeight: 1.2,
        }}
      >
        Active promos
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          fontStyle: 'italic',
          color: 'var(--color-text-secondary)',
          margin: '0 0 0.25rem',
          lineHeight: 1.5,
        }}
      >
        {promos.length} routes live now · scraped directly from {programName}.
        Rates rotate monthly.
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
          margin: '0 0 2rem',
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

      {/* Top 3 Picks rail ───────────────────────────────────────────── */}
      {top3.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-primary)',
              margin: '0 0 0.75rem',
            }}
          >
            Promo picks · Curator&apos;s shortlist
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
              gap: '0.875rem',
            }}
          >
            {top3.map((p) => (
              <TopPickTile key={p.id} promo={p} />
            ))}
          </div>
        </div>
      )}

      {/* Regional buckets ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sortedBuckets.map(([region, rows]) => (
          <RegionBucket key={region} region={region} promos={rows} />
        ))}
      </div>
    </section>
  )
}

/**
 * Top 3 pick tile — cream background, gold hairline border. Compact
 * read of route + price + hedge.
 */
function TopPickTile({ promo }: { promo: PromoReward }) {
  const route =
    promo.origin_label && promo.dest_label
      ? `${promo.origin_label} → ${promo.dest_label}`
      : promo.dest_label
        ? promo.dest_label
        : 'Route'
  const baseline = promo.points_baseline ?? promo.intel_inferred_baseline
  const isInferred =
    promo.points_baseline == null && promo.intel_inferred_baseline != null

  return (
    <article
      style={{
        padding: '1rem 1.125rem',
        background: '#FBF7F0',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        borderRadius: '0.5rem',
        display: 'grid',
        gap: '0.25rem',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {route}
      </h3>
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}
      >
        {promo.points_required?.toLocaleString() ?? '—'}
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginLeft: '0.375rem',
          }}
        >
          {promo.cabin ?? ''} miles
        </span>
      </div>
      {baseline != null && promo.intel_discount_percent != null && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          rate {isInferred ? '~' : ''}
          {baseline.toLocaleString()}, {Math.round(promo.intel_discount_percent)}% off
        </p>
      )}
    </article>
  )
}

/**
 * Regional bucket — collapsed by default. Shows region name + count +
 * "from Xk miles" stat in the summary; expands to a two-column compact
 * list of all routes in the region.
 */
function RegionBucket({
  region,
  promos,
}: {
  region: PromoRegion
  promos: PromoReward[]
}) {
  const sorted = [...promos].sort((a, b) => {
    return (a.points_required ?? Infinity) - (b.points_required ?? Infinity)
  })
  const minPoints = Math.min(...sorted.map((p) => p.points_required ?? Infinity))
  const cabins = Array.from(
    new Set(sorted.map((p) => p.cabin).filter(Boolean)),
  ) as string[]
  const validThroughs = Array.from(
    new Set(sorted.map((p) => p.valid_to).filter(Boolean)),
  ) as string[]

  return (
    <details
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        padding: 0,
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {REGION_LABEL[region]}
          </h3>
          {(cabins.length > 0 || validThroughs.length > 0) && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                fontStyle: 'italic',
                margin: '0.25rem 0 0',
              }}
            >
              {cabins.join(' + ').toLowerCase()}
              {validThroughs.length === 1 && (
                <>
                  {cabins.length > 0 && ' · '}
                  through {formatValidThrough(validThroughs[0])}
                </>
              )}
            </p>
          )}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}
        >
          {sorted.length} route{sorted.length === 1 ? '' : 's'} · from{' '}
          <span style={{ color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {minPoints >= 1000
              ? `${(minPoints / 1000).toFixed(minPoints % 1000 === 0 ? 0 : 1)}k`
              : minPoints.toLocaleString()}
          </span>
        </div>
      </summary>

      <div
        style={{
          borderTop: '1px solid var(--color-border-soft)',
          padding: '1.25rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
          gap: '0.5rem 2rem',
        }}
      >
        {sorted.map((p) => (
          <PromoLine key={p.id} promo={p} />
        ))}
      </div>
    </details>
  )
}

function PromoLine({ promo }: { promo: PromoReward }) {
  const baseline = promo.points_baseline ?? promo.intel_inferred_baseline
  const isInferred =
    promo.points_baseline == null && promo.intel_inferred_baseline != null
  const route =
    promo.origin_label && promo.dest_label
      ? `${promo.origin_label} → ${promo.dest_label}`
      : promo.dest_label ?? 'Route'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.375rem 0',
        borderBottom: '1px dotted var(--color-border-soft)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9375rem',
        lineHeight: 1.4,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: 'var(--color-text-primary)', minWidth: 0 }}>
        {route}
        {promo.cabin && (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
            {' · '}
            {promo.cabin}
          </span>
        )}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: '0.5rem',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
            color: 'var(--color-primary)',
          }}
        >
          {promo.points_required?.toLocaleString() ?? '—'}
        </span>
        {baseline != null && promo.intel_discount_percent != null && (
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            (rate {isInferred ? '~' : ''}
            {baseline.toLocaleString()})
          </span>
        )}
      </span>
    </div>
  )
}

function formatValidThrough(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
