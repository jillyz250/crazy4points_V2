import Link from 'next/link'
import type { PartnerRedemptionWithPrograms } from '@/utils/supabase/queries'
import type { AwardCostResult } from '@/lib/awardChart'

const ALLIANCE_COLOR: Record<string, string> = {
  oneworld: '#C8102E',
  skyteam: '#0033A0',
  star_alliance: '#1A1A1A',
  none: '#6B2D8F',
  other: '#6B2D8F',
}

function fmtKilo(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
}

function fmtMiles(low: number | null, high: number | null, model: string): string {
  if (low === null && high === null) return 'No published rate'
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

function feeTone(high: number | null | undefined): 'good' | 'fair' | 'bad' | 'neutral' {
  if (high == null) return 'neutral'
  if (high <= 50) return 'good'
  if (high <= 200) return 'fair'
  return 'bad'
}

const FEE_TONE_STYLE = {
  good: { bg: '#D1FAE5', fg: '#065F46' },
  fair: { bg: '#FEF3C7', fg: '#78350F' },
  bad: { bg: '#FECACA', fg: '#7F1D1D' },
  neutral: { bg: 'var(--color-background-soft)', fg: 'var(--color-text-secondary)' },
} as const

const COMPLEXITY_STYLE = {
  easy: { label: 'Easy', bg: '#D1FAE5', fg: '#065F46' },
  annoying: { label: 'Has hoops', bg: '#FEF3C7', fg: '#78350F' },
  nerd_stuff: { label: 'Advanced', bg: '#E0E7FF', fg: '#3730A3' },
} as const

const REALITY_STYLE = {
  excellent: { label: 'Easy to book', bg: '#D1FAE5', fg: '#065F46' },
  good: { label: 'Usually open', bg: '#D1FAE5', fg: '#065F46' },
  mixed: { label: 'Worth a search', bg: '#FEF3C7', fg: '#78350F' },
  rare: { label: 'Set an alert', bg: '#FED7AA', fg: '#7C2D12' },
  unicorn: { label: "Don't count on it", bg: '#FECACA', fg: '#7F1D1D' },
} as const

const SURCHARGE_STYLE = {
  none: { label: 'No fuel surcharges', bg: '#D1FAE5', fg: '#065F46' },
  low: { label: 'Low fuel surcharges', bg: '#FEF3C7', fg: '#78350F' },
  high: { label: 'High fuel surcharges', bg: '#FECACA', fg: '#7F1D1D' },
} as const

function Chip({
  bg,
  fg,
  children,
}: {
  bg: string
  fg: string
  children: React.ReactNode
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '0.1875rem 0.5rem',
        borderRadius: '999px',
        background: bg,
        color: fg,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export default function BestWayToBookResultRow({
  r,
  rank,
}: {
  r: PartnerRedemptionWithPrograms & { computed_cost?: AwardCostResult | null }
  rank: number
}) {
  const stripeColor = ALLIANCE_COLOR[r.operating_carrier?.alliance ?? 'none'] ?? ALLIANCE_COLOR.none
  const cashStr = fmtCash(r.cash_fee_low, r.cash_fee_high)
  const cashTone = feeTone(r.cash_fee_high ?? r.cash_fee_low)

  // Phase 3: prefer chart-computed cost when available (means a structured
  // chart is authored on this currency program). Falls back to stored
  // cost_miles_low/high for programs without a chart yet.
  const computed = r.computed_cost
  const hasComputed = computed != null
  const noPublishedRate =
    !hasComputed && r.cost_miles_low === null && r.cost_miles_high === null

  // Range vs single number from compute
  const computedRange =
    hasComputed && typeof computed!.miles === 'object'
      ? (computed!.miles as { low: number; high: number })
      : null
  const computedSingle =
    hasComputed && typeof computed!.miles === 'number'
      ? (computed!.miles as number)
      : null

  // Dynamic-pricing warning: prefer compute-derived signal (source =
  // 'dynamic_estimate'), fall back to legacy heuristic.
  const isWideRange =
    !hasComputed &&
    r.cost_miles_low != null &&
    r.cost_miles_high != null &&
    r.cost_miles_high >= r.cost_miles_low * 3
  const showDynamicChip =
    computed?.source === 'dynamic_estimate' || (!hasComputed && r.pricing_model === 'dynamic') || isWideRange

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: '1rem',
        padding: '1rem 1.125rem',
        background: '#fff',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${stripeColor}`,
        borderRadius: 'var(--radius-card)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.375rem',
          }}
        >
          {rank <= 3 && (
            <span
              style={{
                fontSize: '0.875rem',
              }}
              aria-hidden
            >
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </span>
          )}
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.0625rem',
              color: 'var(--color-primary)',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {r.currency_program ? (
              <Link href={`/programs/${r.currency_program.slug}`}>
                {r.currency_program.name}
              </Link>
            ) : (
              'Unknown program'
            )}
          </h3>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.5rem',
          }}
        >
          on{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>
            {r.operating_carrier?.name ?? 'Unknown carrier'}
          </strong>{' '}
          · {r.region_or_route}
        </div>

        {r.teach_caption && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
              margin: '0 0 0.5rem',
              lineHeight: 1.5,
            }}
          >
            {r.teach_caption}
          </p>
        )}

        {r.what_breaks_this && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: '#7F1D1D',
              margin: '0 0 0.5rem',
              lineHeight: 1.5,
              paddingLeft: '1.25rem',
              position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', left: 0, top: 0 }}>⚠</span>
            {r.what_breaks_this}
          </p>
        )}

        {r.fees_note && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              margin: '0 0 0.5rem',
            }}
          >
            <strong style={{ color: 'var(--color-text-primary)' }}>Fees:</strong>{' '}
            {r.fees_note}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
            marginTop: '0.5rem',
          }}
        >
          {r.fuel_surcharges && (
            <Chip
              bg={SURCHARGE_STYLE[r.fuel_surcharges].bg}
              fg={SURCHARGE_STYLE[r.fuel_surcharges].fg}
            >
              {SURCHARGE_STYLE[r.fuel_surcharges].label}
            </Chip>
          )}
          {r.complexity_score && (
            <Chip
              bg={COMPLEXITY_STYLE[r.complexity_score].bg}
              fg={COMPLEXITY_STYLE[r.complexity_score].fg}
            >
              {COMPLEXITY_STYLE[r.complexity_score].label}
            </Chip>
          )}
          {r.availability_reality && (
            <Chip
              bg={REALITY_STYLE[r.availability_reality].bg}
              fg={REALITY_STYLE[r.availability_reality].fg}
            >
              {REALITY_STYLE[r.availability_reality].label}
            </Chip>
          )}
          {r.bookable_online === false && (
            <Chip bg="#FEF3C7" fg="#78350F">
              Phone booking
            </Chip>
          )}
          {r.devalued_at && (
            <Chip bg="#FED7AA" fg="#7C2D12">
              Devalued {r.devalued_at.slice(0, 7)}
            </Chip>
          )}
          {showDynamicChip && (
            <Chip bg="#FED7AA" fg="#7C2D12">
              Dynamic — expect upper end
            </Chip>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', minWidth: '5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: noPublishedRate ? '0.875rem' : '1.625rem',
            color: noPublishedRate
              ? 'var(--color-text-secondary)'
              : 'var(--color-primary)',
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {hasComputed
            ? computedRange
              ? `${fmtKilo(computedRange.low)}–${fmtKilo(computedRange.high)}`
              : fmtKilo(computedSingle as number)
            : fmtMiles(r.cost_miles_low, r.cost_miles_high, r.pricing_model)}
        </div>
        {hasComputed && computed!.band && (
          <div
            style={{
              fontSize: '0.625rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.125rem',
              fontStyle: 'italic',
            }}
          >
            {computed!.band}
            {computed!.season ? ` · ${computed!.season}` : ''}
          </div>
        )}
        {!noPublishedRate && (
          <div
            style={{
              fontSize: '0.625rem',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: '0.125rem',
              fontWeight: 600,
            }}
          >
            miles
          </div>
        )}
        {cashStr && (
          <div
            style={{
              marginTop: '0.375rem',
              display: 'inline-block',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.1875rem 0.5rem',
              borderRadius: '999px',
              background: FEE_TONE_STYLE[cashTone].bg,
              color: FEE_TONE_STYLE[cashTone].fg,
            }}
          >
            {cashStr}
          </div>
        )}
      </div>
    </article>
  )
}
