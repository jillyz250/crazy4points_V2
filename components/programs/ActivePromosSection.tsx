import type { PromoReward } from '@/utils/supabase/promoQueries'

/**
 * Public "Active Promos" section on /programs/[slug]. Renders published
 * promo_rewards rows scraped from the program's own site, with verified
 * timestamps and an Option B per-promo baseline display ("rate ~X,
 * currently N% off") when the scraped page labeled a discount %.
 *
 * Cardinal rule from plans/promo-scraper.md: nothing renders unless
 * admin_status='published' AND last_seen_active=true. The query
 * (getActivePromosForProgram) enforces both, plus filters expired
 * valid_to dates.
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

  // Group by route bucket label when origin/dest labels look like regions
  // ("Europe → New York"); otherwise group all together.
  const groups = new Map<string, PromoReward[]>()
  for (const p of promos) {
    const key = `${p.origin_label ?? p.origin_iata ?? '—'} → ${p.dest_label ?? p.dest_iata ?? '—'}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  const sorted = Array.from(groups.entries()).sort((a, b) => {
    // Cheapest in each group floats the group higher
    const minA = Math.min(...a[1].map((p) => p.points_required ?? Infinity))
    const minB = Math.min(...b[1].map((p) => p.points_required ?? Infinity))
    return minA - minB
  })

  // Newest scrape across all rows — for the section-level timestamp.
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
        marginBottom: '2.5rem',
        scrollMarginTop: '2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            margin: 0,
          }}
        >
          Active promos
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            color: isStale ? '#92400E' : 'var(--color-text-secondary)',
            background: isStale ? '#FEF3C7' : 'transparent',
            padding: isStale ? '0.125rem 0.5rem' : '0',
            borderRadius: '999px',
          }}
        >
          Verified {new Date(newestScrape).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          {isStale && ' — data may be stale'}
        </span>
      </div>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '1rem',
          lineHeight: 1.55,
        }}
      >
        Scraped directly from {programName}&apos;s website. Promo rates
        rotate monthly — these are what&apos;s on offer right now.
        {programChartUrl && (
          <>
            {' '}
            <a
              href={programChartUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-primary)', fontWeight: 600 }}
            >
              View {programName}&apos;s official rates →
            </a>
          </>
        )}
      </p>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {sorted.map(([routeKey, group]) => (
          <RouteGroup key={routeKey} routeLabel={routeKey} promos={group} />
        ))}
      </div>
    </section>
  )
}

function RouteGroup({
  routeLabel,
  promos,
}: {
  routeLabel: string
  promos: PromoReward[]
}) {
  // Sort cabins by mileage cost ascending
  const sortedPromos = [...promos].sort((a, b) => {
    return (a.points_required ?? Infinity) - (b.points_required ?? Infinity)
  })

  return (
    <article
      style={{
        padding: '1rem 1.125rem',
        background: 'linear-gradient(135deg, #F8F5FB 0%, #FFFFFF 100%)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.0625rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          margin: '0 0 0.5rem',
        }}
      >
        {routeLabel}
      </h3>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gap: '0.375rem',
        }}
      >
        {sortedPromos.map((p) => (
          <PromoLine key={p.id} promo={p} />
        ))}
      </ul>
    </article>
  )
}

function PromoLine({ promo }: { promo: PromoReward }) {
  // Per Option B (plans/promo-scraper.md locked 2026-05-13):
  // "rate ~X, currently N% off" — uses "rate" not "rack rate"; uses ~
  // for inferred baselines, no ~ for explicit ones.
  const baseline = promo.points_baseline ?? promo.intel_inferred_baseline
  const isInferred = promo.points_baseline == null && promo.intel_inferred_baseline != null
  const discount = promo.intel_discount_percent

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '0.5rem',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9375rem',
        color: 'var(--color-text-primary)',
        lineHeight: 1.5,
      }}
    >
      {promo.carrier_slug && (
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
          }}
        >
          {promo.carrier_slug.replace(/-/g, ' ')}
        </span>
      )}
      {promo.cabin && (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {promo.cabin}
        </span>
      )}
      {promo.points_required != null && (
        <strong style={{ color: 'var(--color-primary)' }}>
          {promo.points_required.toLocaleString()} miles
        </strong>
      )}
      {baseline != null && discount != null && (
        <span
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
          }}
        >
          (rate {isInferred ? '~' : ''}
          {baseline.toLocaleString()}, currently{' '}
          {discount % 1 === 0 ? discount : discount.toFixed(1)}% off)
        </span>
      )}
      {promo.valid_to && (
        <span
          style={{
            fontSize: '0.75rem',
            color: '#92400E',
            background: '#FEF3C7',
            padding: '0.125rem 0.5rem',
            borderRadius: '999px',
            fontWeight: 600,
          }}
        >
          Through {formatValidThrough(promo.valid_to)}
        </span>
      )}
    </li>
  )
}

function formatValidThrough(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}
