import Link from 'next/link'
import type { EnrichedRedemptionRow } from '@/utils/supabase/bestWayToBookQueries'
import HowToBookDisclosure from '@/components/hub/HowToBookDisclosure'
import { displayCarrierName } from '@/lib/carrierDisplay'

const ALLIANCE_COLOR: Record<string, string> = {
  oneworld: '#C8102E',
  skyteam: '#0033A0',
  star_alliance: '#1A1A1A',
  none: '#6B2D8F',
  other: '#6B2D8F',
}

const ALLIANCE_LABEL: Record<string, string> = {
  oneworld: 'Oneworld',
  skyteam: 'SkyTeam',
  star_alliance: 'Star Alliance',
}

function fmtKilo(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
}

function fmtMiles(low: number | null, high: number | null, model: string): string {
  if (low === null && high === null) return 'No published rate'
  const f = fmtKilo
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

// Chips fire only when there's information worth flagging — the default
// "easy / lots of space / online bookable" case is communicated by the
// ABSENCE of chips.
const COMPLEXITY_STYLE: Record<string, { label: string; bg: string; fg: string } | null> = {
  easy: null,
  annoying: { label: 'Has hoops', bg: '#FEF3C7', fg: '#78350F' },
  nerd_stuff: { label: 'Routing knowledge', bg: '#E0E7FF', fg: '#3730A3' },
}

const REALITY_STYLE: Record<string, { label: string; bg: string; fg: string } | null> = {
  excellent: null,
  good: null,
  mixed: { label: 'Worth a search', bg: '#FEF3C7', fg: '#78350F' },
  rare: { label: 'Set an alert', bg: '#FED7AA', fg: '#7C2D12' },
  unicorn: { label: "Don't count on it", bg: '#FECACA', fg: '#7F1D1D' },
}

const SURCHARGE_STYLE = {
  none: { label: 'No fuel surcharges', bg: '#D1FAE5', fg: '#065F46' },
  low: { label: 'Low fuel surcharges', bg: '#FEF3C7', fg: '#78350F' },
  high: { label: 'High fuel surcharges', bg: '#FECACA', fg: '#7F1D1D' },
} as const

function Chip({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
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

/** A carrier (operating metal) plus every authored way to book it. */
export interface CarrierGroup {
  carrierId: string
  carrier: EnrichedRedemptionRow['operating_carrier']
  /** Cheapest typical-miles cost across this carrier's options (group sort key). */
  cheapestTypical: number
  /** Booking options, sorted cheapest first. */
  options: EnrichedRedemptionRow[]
}

/** Typical miles for one row: chart-computed when available, else stored midpoint. */
function rowTypical(r: EnrichedRedemptionRow): number {
  if (r.computed_cost) return r.computed_cost.typical
  if (r.cost_miles_low != null && r.cost_miles_high != null) {
    return Math.round((r.cost_miles_low + r.cost_miles_high) / 2)
  }
  return r.cost_miles_low ?? r.cost_miles_high ?? Number.POSITIVE_INFINITY
}

/**
 * Group the flat redemption list by operating carrier (the metal you fly).
 * Each group lists every currency/program that can book that metal, sorted
 * cheapest first. Groups themselves are sorted by their cheapest option, so
 * the carrier with the single best deal leads.
 *
 * Rows without an operating carrier (rare) each become their own one-option
 * group keyed by row id, so nothing is silently dropped.
 */
export function groupByCarrier(rows: EnrichedRedemptionRow[]): CarrierGroup[] {
  const byCarrier = new Map<string, EnrichedRedemptionRow[]>()
  for (const r of rows) {
    const key = r.operating_carrier_id ?? `__row_${r.id}`
    const list = byCarrier.get(key)
    if (list) list.push(r)
    else byCarrier.set(key, [r])
  }

  const groups: CarrierGroup[] = []
  for (const [carrierId, list] of byCarrier) {
    const options = list.slice().sort((a, b) => rowTypical(a) - rowTypical(b))
    groups.push({
      carrierId,
      carrier: options[0].operating_carrier,
      cheapestTypical: rowTypical(options[0]),
      options,
    })
  }

  return groups.sort((a, b) => a.cheapestTypical - b.cheapestTypical)
}

/** One booking option (currency program) within a carrier group. */
function OptionLine({ r }: { r: EnrichedRedemptionRow }) {
  const computed = r.computed_cost
  const hasComputed = computed != null
  const noPublishedRate =
    !hasComputed && r.cost_miles_low === null && r.cost_miles_high === null

  const computedRange =
    hasComputed && typeof computed!.miles === 'object'
      ? (computed!.miles as { low: number; high: number })
      : null
  const computedSingle =
    hasComputed && typeof computed!.miles === 'number' ? (computed!.miles as number) : null

  const isWideRange =
    !hasComputed &&
    r.cost_miles_low != null &&
    r.cost_miles_high != null &&
    r.cost_miles_high >= r.cost_miles_low * 3
  const showDynamicChip =
    computed?.source === 'dynamic_estimate' ||
    (!hasComputed && r.pricing_model === 'dynamic') ||
    isWideRange

  const cashStr = fmtCash(r.cash_fee_low, r.cash_fee_high)
  const cashTone = feeTone(r.cash_fee_high ?? r.cash_fee_low)

  const milesStr = hasComputed
    ? computedRange
      ? `${fmtKilo(computedRange.low)}–${fmtKilo(computedRange.high)}`
      : fmtKilo(computedSingle as number)
    : fmtMiles(r.cost_miles_low, r.cost_miles_high, r.pricing_model)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderTop: '1px solid var(--color-border-soft)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h4
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            color: 'var(--color-primary)',
            margin: '0 0 0.25rem',
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
        </h4>

        {r.region_or_route && (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem',
            }}
          >
            {r.region_or_route}
          </div>
        )}

        {r.teach_caption && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
              margin: '0 0 0.375rem',
              lineHeight: 1.5,
            }}
          >
            {r.teach_caption}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {r.fuel_surcharges && (
            <Chip
              bg={SURCHARGE_STYLE[r.fuel_surcharges].bg}
              fg={SURCHARGE_STYLE[r.fuel_surcharges].fg}
            >
              {SURCHARGE_STYLE[r.fuel_surcharges].label}
            </Chip>
          )}
          {r.complexity_score && COMPLEXITY_STYLE[r.complexity_score] && (
            <Chip
              bg={COMPLEXITY_STYLE[r.complexity_score]!.bg}
              fg={COMPLEXITY_STYLE[r.complexity_score]!.fg}
            >
              {COMPLEXITY_STYLE[r.complexity_score]!.label}
            </Chip>
          )}
          {r.availability_reality && REALITY_STYLE[r.availability_reality] && (
            <Chip
              bg={REALITY_STYLE[r.availability_reality]!.bg}
              fg={REALITY_STYLE[r.availability_reality]!.fg}
            >
              {REALITY_STYLE[r.availability_reality]!.label}
            </Chip>
          )}
          {r.bookable_online === false && (
            <Chip bg="#FEF3C7" fg="#78350F">
              Phone booking
            </Chip>
          )}
          {showDynamicChip && (
            <Chip bg="#FED7AA" fg="#7C2D12">
              Dynamic — expect upper end
            </Chip>
          )}
          {!hasComputed && !noPublishedRate && (
            <Chip bg="var(--color-background-soft)" fg="var(--color-text-secondary)">
              Approximate
            </Chip>
          )}
        </div>

        <HowToBookDisclosure r={r} />
      </div>

      <div style={{ textAlign: 'right', minWidth: '4.5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: noPublishedRate ? '0.8125rem' : '1.375rem',
            color: noPublishedRate ? 'var(--color-text-secondary)' : 'var(--color-primary)',
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {milesStr}
        </div>
        {!noPublishedRate && (
          <div
            style={{
              fontSize: '0.625rem',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: '0.0625rem',
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
    </div>
  )
}

export default function BestWayToBookCarrierGroup({
  group,
  rank,
}: {
  group: CarrierGroup
  rank: number
}) {
  const alliance = group.carrier?.alliance ?? 'none'
  const stripeColor = ALLIANCE_COLOR[alliance] ?? ALLIANCE_COLOR.none
  const allianceLabel = ALLIANCE_LABEL[alliance]
  const optionCount = group.options.length

  return (
    <article
      style={{
        padding: '1rem 1.125rem',
        background: '#fff',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${stripeColor}`,
        borderRadius: 'var(--radius-card)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.25rem',
        }}
      >
        {rank <= 3 && (
          <span style={{ fontSize: '0.875rem' }} aria-hidden>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </span>
        )}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1875rem',
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Fly on{' '}
          <span style={{ color: 'var(--color-primary)' }}>
            {displayCarrierName(group.carrier)}
          </span>
        </h3>
        {allianceLabel && (
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            {allianceLabel}
          </span>
        )}
      </header>

      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '0.25rem',
        }}
      >
        {optionCount} {optionCount === 1 ? 'way' : 'ways'} to book ·{' '}
        from {fmtKilo(group.cheapestTypical)} miles
      </div>

      <div>
        {group.options.map((r) => (
          <OptionLine key={r.id} r={r} />
        ))}
      </div>
    </article>
  )
}
