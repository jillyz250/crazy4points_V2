import Link from 'next/link'
import type { PartnerRedemptionWithPrograms } from '@/utils/supabase/queries'

const ALLIANCE_COLOR: Record<string, string> = {
  oneworld: '#C8102E',
  skyteam: '#0033A0',
  star_alliance: '#1A1A1A',
  none: '#6B2D8F',
  other: '#6B2D8F',
}

const HEALTH_STYLE = {
  excellent: { label: 'Stable', bg: '#D1FAE5', fg: '#065F46' },
  good: { label: 'Stable', bg: '#D1FAE5', fg: '#065F46' },
  mixed: { label: 'At risk', bg: '#FEF3C7', fg: '#78350F' },
} as const

const COMPLEXITY_LABEL = {
  easy: 'Easy to book',
  annoying: 'A bit of friction',
  nerd_stuff: 'Power-user move',
} as const

function fmt(low: number | null, high: number | null, model: string): string {
  if (low === null && high === null) return 'Verify'
  const f = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
  if (low !== null && high !== null && low !== high) return `${f(low)}-${f(high)}`
  const single = low ?? high!
  return model === 'dynamic' ? `~${f(single)}` : f(single)
}

function fmtCash(low: number | null | undefined, high: number | null | undefined): string | null {
  if (low == null && high == null) return null
  if (low != null && high != null && low !== high) return `+ $${low}-${high}`
  const single = low ?? high
  return single == null ? null : `+ $${single}`
}

// Map a row to a Best Way to Book route hint when a specific airport pair
// makes sense. Static lookup for v1; we just default to a sensible US hub
// pair for each route bucket. Power users can re-enter exact codes.
const BUCKET_TO_EXAMPLE_ROUTE: Record<string, { from: string; to: string }> = {
  'us-short': { from: 'LGA', to: 'CMH' },
  'us-medium': { from: 'JFK', to: 'ORD' },
  'us-long': { from: 'JFK', to: 'HNL' },
  'us-eu-east': { from: 'JFK', to: 'LHR' },
  'us-eu-west': { from: 'LAX', to: 'CDG' },
  'us-japan': { from: 'LAX', to: 'NRT' },
  'us-se-asia': { from: 'JFK', to: 'HKG' },
  'us-me-india': { from: 'JFK', to: 'DOH' },
  'us-pacific': { from: 'LAX', to: 'SYD' },
  'us-africa': { from: 'JFK', to: 'JNB' },
  'us-samerica': { from: 'JFK', to: 'GRU' },
}

export default function SweetSpotCard({ r }: { r: PartnerRedemptionWithPrograms }) {
  const stripeColor = ALLIANCE_COLOR[r.operating_carrier?.alliance ?? 'none'] ?? ALLIANCE_COLOR.none
  const health = r.availability_reality && r.availability_reality in HEALTH_STYLE
    ? HEALTH_STYLE[r.availability_reality as keyof typeof HEALTH_STYLE]
    : null
  const cashStr = fmtCash(r.cash_fee_low, r.cash_fee_high)
  const bucket = r.route_buckets?.[0]
  const example = bucket ? BUCKET_TO_EXAMPLE_ROUTE[bucket] : null
  const cabinSlug = r.cabin.replace(/ /g, '+')

  return (
    <article
      style={{
        padding: '1.125rem',
        background: '#fff',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${stripeColor}`,
        borderRadius: 'var(--radius-card)',
        display: 'grid',
        gap: '0.625rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.0625rem',
            color: 'var(--color-primary)',
            margin: 0,
            lineHeight: 1.25,
            flex: 1,
            minWidth: '12rem',
          }}
        >
          {r.cabin} on{' '}
          <span style={{ color: 'var(--color-text-primary)' }}>
            {r.operating_carrier?.name ?? 'Unknown'}
          </span>
        </h3>
        {health && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.1875rem 0.5rem',
              borderRadius: '999px',
              background: health.bg,
              color: health.fg,
              fontFamily: 'var(--font-ui)',
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {health.label}
          </span>
        )}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        Pay with{' '}
        {r.currency_program ? (
          <Link href={`/programs/${r.currency_program.slug}`}>
            <strong style={{ color: 'var(--color-primary)' }}>
              {r.currency_program.name}
            </strong>
          </Link>
        ) : (
          'Unknown'
        )}{' '}
        · {r.region_or_route}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--color-primary)',
            fontWeight: 700,
          }}
        >
          {fmt(r.cost_miles_low, r.cost_miles_high, r.pricing_model)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          miles
        </span>
        {cashStr && (
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.125rem 0.4375rem',
              borderRadius: '999px',
              background: 'var(--color-background-soft)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {cashStr}
          </span>
        )}
      </div>

      {r.teach_caption && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          {r.teach_caption}
        </p>
      )}

      {r.what_breaks_this && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: '#7F1D1D',
            margin: 0,
            lineHeight: 1.5,
            paddingLeft: '1.25rem',
            position: 'relative',
          }}
        >
          <span style={{ position: 'absolute', left: 0, top: 0 }}>⚠</span>
          What might kill it: {r.what_breaks_this}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.375rem',
          marginTop: '0.25rem',
        }}
      >
        {r.complexity_score && (
          <span
            style={{
              padding: '0.1875rem 0.5rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-background-soft)',
              borderRadius: '999px',
            }}
          >
            {COMPLEXITY_LABEL[r.complexity_score]}
          </span>
        )}
        {r.fuel_surcharges === 'high' && (
          <span
            style={{
              padding: '0.1875rem 0.5rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#7F1D1D',
              background: '#FECACA',
              borderRadius: '999px',
            }}
          >
            High fuel surcharges
          </span>
        )}
      </div>

      {example && (
        <Link
          href={`/hub/best-way-to-book?from=${example.from}&to=${example.to}&cabin=${cabinSlug}`}
          style={{
            marginTop: '0.5rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            textDecoration: 'none',
            alignSelf: 'flex-start',
          }}
        >
          See all options for {example.from} → {example.to} →
        </Link>
      )}
    </article>
  )
}
