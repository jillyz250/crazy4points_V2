'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type {
  PartnerRedemptionWithPrograms,
  Program,
  Alliance,
  RedemptionCabin,
} from '@/utils/supabase/queries'

// ─── Color tokens (domain-specific to this section) ───────────────────────────
const ALLIANCE_COLOR: Record<string, string> = {
  oneworld: '#C8102E',
  skyteam: '#0033A0',
  star_alliance: '#1A1A1A',
  none: '#6B2D8F',
  other: '#6B2D8F',
}
const ALLIANCE_LABEL: Record<string, string> = {
  oneworld: 'oneworld',
  skyteam: 'SkyTeam',
  star_alliance: 'Star Alliance',
  none: 'Independent',
  other: 'Partnership',
}

const CABIN_BG: Record<RedemptionCabin, string> = {
  Economy: '#E0F2FE',
  'Premium Economy': '#CCFBF1',
  Business: '#1E3A8A',
  First: '#D4AF37',
}
const CABIN_FG: Record<RedemptionCabin, string> = {
  Economy: '#075985',
  'Premium Economy': '#115E59',
  Business: '#FFFFFF',
  First: '#3B2F00',
}
const CABIN_ORDER: Record<RedemptionCabin, number> = {
  Economy: 0,
  'Premium Economy': 1,
  Business: 2,
  First: 3,
}
const CABIN_OPTIONS: RedemptionCabin[] = ['Economy', 'Premium Economy', 'Business', 'First']

// ─── Route buckets ────────────────────────────────────────────────────────────
type RouteBucket =
  | 'us-short'
  | 'us-transcon'
  | 'us-eu'
  | 'us-jp'
  | 'us-sea'
  | 'us-me'
  | 'us-africa'
  | 'us-pacific'
  | 'us-samerica'

const ROUTE_BUCKETS: { id: RouteBucket; emoji: string; label: string; short: string }[] = [
  { id: 'us-short', emoji: '🇺🇸', label: 'Within US — short-haul', short: 'US short' },
  { id: 'us-transcon', emoji: '🇺🇸', label: 'Within US — transcon', short: 'US transcon' },
  { id: 'us-eu', emoji: '🇪🇺', label: 'US ↔ Europe', short: 'US ↔ EU' },
  { id: 'us-jp', emoji: '🌏', label: 'US ↔ Japan / Korea', short: 'US ↔ JP/KR' },
  { id: 'us-sea', emoji: '🌏', label: 'US ↔ SE Asia / China', short: 'US ↔ SE Asia' },
  { id: 'us-me', emoji: '🌍', label: 'US ↔ Middle East / India', short: 'US ↔ ME/India' },
  { id: 'us-pacific', emoji: '🇦🇺', label: 'US ↔ South Pacific', short: 'US ↔ Pacific' },
  { id: 'us-africa', emoji: '🌍', label: 'US ↔ Africa', short: 'US ↔ Africa' },
  { id: 'us-samerica', emoji: '🌎', label: 'US ↔ South America', short: 'US ↔ S. America' },
]

function mapRouteToBuckets(text: string): RouteBucket[] {
  const t = text.toLowerCase()
  const buckets = new Set<RouteBucket>()

  // International region matches first (more specific)
  if (/(us to europe|to europe|transatlantic|us ?↔ ?europe|distance band [123]|0-650|651-1150|1151-2000)/.test(t)) {
    // Avios distance bands cover US short + transcon depending on band
    if (/0-650/.test(t)) buckets.add('us-short')
    else if (/651-1150|1151-2000|distance band [23]/.test(t)) buckets.add('us-transcon')
    if (/europe|transatlantic/.test(t)) buckets.add('us-eu')
  }
  if (/europe/.test(t) && !/asia.*europe/.test(t)) buckets.add('us-eu')
  if (/japan|korea|asia \(japan/.test(t)) buckets.add('us-jp')
  if (/se asia|china|hong kong|hkg|asia \(se asia|asia 2/.test(t)) buckets.add('us-sea')
  if (/middle east|india|asia 1.*middle|me\b/.test(t)) buckets.add('us-me')
  if (/south pacific|australia|nz|fiji/.test(t)) buckets.add('us-pacific')
  if (/africa/.test(t)) buckets.add('us-africa')
  if (/south america/.test(t)) buckets.add('us-samerica')

  // "Long-haul (US to Asia / EU)" — applies to multiple
  if (/long-haul.*asia.*eu|long-haul.*us.*asia.*eu/.test(t)) {
    buckets.add('us-eu')
    buckets.add('us-jp')
    buckets.add('us-sea')
  }

  // Within-US matches
  if (/short-haul|<750|0-650|0-700|distance band 1/.test(t)) buckets.add('us-short')
  if (/transcon|medium-haul|651-1150|1151-2000|701-1400|750-2750|distance band [23]/.test(t)) {
    buckets.add('us-transcon')
  }
  if (/within (north america|us)|us domestic|aa domestic|aa us domestic/.test(t) && buckets.size === 0) {
    buckets.add('us-short')
    buckets.add('us-transcon')
  }
  // Generic "AA short-haul" / "AA medium-haul" without further qualifier
  if (/^aa short-haul$/.test(t) || /\baa short-haul\b/.test(t)) buckets.add('us-short')
  if (/aa medium-haul/.test(t)) buckets.add('us-transcon')

  // Cathay / JAL "AA long-haul" — refers to the partner's metal route from US to their hub
  if (/aa long-haul/.test(t) && buckets.size === 0) {
    // Cathay long-haul AA = HKG-USA, JAL long-haul = NRT/HND-USA
    // Without the carrier context here, assume the row's grouping covers it
    buckets.add('us-jp')
    buckets.add('us-sea')
  }

  return Array.from(buckets)
}

const SURCHARGE_TONE = {
  none: { label: 'No surcharges', bg: '#D1FAE5', fg: '#065F46' },
  low: { label: 'Low surcharges', bg: '#FEF3C7', fg: '#78350F' },
  high: { label: 'High surcharges', bg: '#FECACA', fg: '#7F1D1D' },
} as const

// ─── Shared styles ────────────────────────────────────────────────────────────
const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--color-primary)',
  marginBottom: '0.5rem',
}
const subtextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  marginBottom: '1.25rem',
}
const baseChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '0.1875rem 0.5rem',
  borderRadius: '999px',
  whiteSpace: 'nowrap',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCost(low: number | null, high: number | null, model: string): string {
  if (low === null && high === null) return 'No published rate'
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
  if (low !== null && high !== null && low !== high) return `${fmt(low)}–${fmt(high)}`
  const single = low ?? high!
  return model === 'dynamic' ? `~${fmt(single)}` : fmt(single)
}

function allianceTone(a: Alliance | null | undefined): { color: string; label: string } {
  const key = a ?? 'none'
  return { color: ALLIANCE_COLOR[key] ?? ALLIANCE_COLOR.none, label: ALLIANCE_LABEL[key] ?? ALLIANCE_LABEL.none }
}

function buildSaverSearchUrl(template: string): string {
  return template.replace(/\{origin\}|\{destination\}|\{date\}/g, '')
}

// ─── Card row ────────────────────────────────────────────────────────────────
function CardRow({
  r,
  side,
}: {
  r: PartnerRedemptionWithPrograms
  side: 'asCurrency' | 'asOperating'
}) {
  const noPublishedRate = r.cost_miles_low === null && r.cost_miles_high === null
  const phoneOnly = r.bookable_online === false
  const counterparty = side === 'asCurrency' ? r.operating_carrier : r.currency_program
  const stripeColor = allianceTone(counterparty?.alliance ?? null).color
  const cabinBg = CABIN_BG[r.cabin] ?? '#E5E7EB'
  const cabinFg = CABIN_FG[r.cabin] ?? '#1A1A1A'

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: '0.75rem',
        alignItems: 'start',
        padding: '0.875rem 1rem',
        background: '#fff',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${stripeColor}`,
        borderRadius: 'var(--radius-ui)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.375rem',
          }}
        >
          <span
            style={{
              ...baseChipStyle,
              background: cabinBg,
              color: cabinFg,
              border: 'none',
            }}
          >
            {r.cabin}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
            }}
          >
            {r.region_or_route}
          </span>
        </div>

        {r.teach_caption && (
          <p
            style={{
              margin: 0,
              fontSize: '0.8125rem',
              fontStyle: 'italic',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {r.teach_caption}
          </p>
        )}

        {r.routing_rules && (
          <p
            style={{
              margin: '0.375rem 0 0',
              fontSize: '0.8125rem',
              color: 'var(--color-text-primary)',
            }}
          >
            {r.routing_rules}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.375rem',
            marginTop: '0.625rem',
          }}
        >
          {r.fuel_surcharges && (
            <span
              style={{
                ...baseChipStyle,
                background: SURCHARGE_TONE[r.fuel_surcharges].bg,
                color: SURCHARGE_TONE[r.fuel_surcharges].fg,
              }}
            >
              {SURCHARGE_TONE[r.fuel_surcharges].label}
            </span>
          )}
          {phoneOnly && (
            <span
              style={{
                ...baseChipStyle,
                background: '#FEF3C7',
                color: '#78350F',
              }}
            >
              Phone booking
            </span>
          )}
          {r.requires_saver_space === false && (
            <span
              style={{
                ...baseChipStyle,
                background: 'var(--color-background-soft)',
                color: 'var(--color-primary)',
              }}
            >
              No saver needed
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: noPublishedRate ? '0.875rem' : '1.5rem',
            color: noPublishedRate ? 'var(--color-text-secondary)' : 'var(--color-primary)',
            lineHeight: 1.1,
            fontWeight: 700,
          }}
        >
          {formatCost(r.cost_miles_low, r.cost_miles_high, r.pricing_model)}
        </div>
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
      </div>
    </article>
  )
}

// ─── Operator-access header (reverse-direction only) ─────────────────────────
function OperatorAccessHeader({
  program,
}: {
  program: Pick<Program, 'name' | 'partner_access' | 'partner_access_notes' | 'saver_search_url_template'>
}) {
  if (!program.partner_access) return null
  const saverUrl = program.saver_search_url_template
    ? buildSaverSearchUrl(program.saver_search_url_template)
    : null

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '1rem 1.125rem',
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      {saverUrl && (
        <a
          href={saverUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--color-primary)',
            color: '#fff',
            padding: '0.4375rem 0.875rem',
            borderRadius: '999px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: program.partner_access_notes ? '0.625rem' : '0.5rem',
          }}
        >
          Check {program.name} for saver space →
        </a>
      )}
      {program.partner_access_notes && (
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {program.partner_access_notes}
        </p>
      )}
      <p
        style={{
          margin: '0.5rem 0 0',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.45,
        }}
      >
        Partners can only book seats released as <strong>saver award space</strong> by
        the operating airline. Confirm saver inventory before transferring miles.
      </p>
    </div>
  )
}

// ─── Spotlight banner ────────────────────────────────────────────────────────
function Spotlight({
  rows,
  side,
  programName,
}: {
  rows: PartnerRedemptionWithPrograms[]
  side: 'asCurrency' | 'asOperating'
  programName: string
}) {
  const cheapest = useMemo(() => {
    let best: PartnerRedemptionWithPrograms | null = null
    for (const r of rows) {
      const c = r.cost_miles_low ?? r.cost_miles_high
      if (c == null) continue
      if (!best || c < (best.cost_miles_low ?? best.cost_miles_high ?? Infinity)) {
        best = r
      }
    }
    return best
  }, [rows])

  if (!cheapest) return null
  const counterparty =
    side === 'asCurrency' ? cheapest.operating_carrier : cheapest.currency_program
  const cost = formatCost(cheapest.cost_miles_low, cheapest.cost_miles_high, cheapest.pricing_model)
  const stripeColor = allianceTone(counterparty?.alliance ?? null).color

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '1rem 1.125rem',
        background: '#fff',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${stripeColor}`,
        borderRadius: 'var(--radius-card)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-hover)',
            marginBottom: '0.25rem',
          }}
        >
          ✨ Cheapest right now
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.0625rem',
            color: 'var(--color-primary)',
            lineHeight: 1.3,
          }}
        >
          {cheapest.cabin} {side === 'asCurrency' ? 'on' : 'with'}{' '}
          <strong>{counterparty?.name ?? 'Unknown'}</strong>
          {' — '}
          <span style={{ color: 'var(--color-text-primary)' }}>{cost} miles</span>
        </div>
        <div
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            marginTop: '0.125rem',
          }}
        >
          {cheapest.region_or_route}
          {side === 'asCurrency'
            ? ` · using ${programName} miles`
            : ''}
        </div>
      </div>
    </div>
  )
}

// ─── Top tool CTA pill ───────────────────────────────────────────────────────
function ToolCTAPill({ operatorSlug, label }: { operatorSlug: string | null; label: string }) {
  const href = operatorSlug
    ? `/tools/ways-to-book?operator=${operatorSlug}`
    : '/tools/ways-to-book'
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4375rem',
        padding: '0.4375rem 0.875rem',
        background: 'linear-gradient(90deg, #F5C300 0%, #FFD93D 100%)',
        color: '#1A1A1A',
        borderRadius: '999px',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        fontWeight: 700,
        textDecoration: 'none',
        marginBottom: '1rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      }}
    >
      <span style={{ fontSize: '0.875rem' }}>💡</span>
      <span>{label}</span>
      <span style={{ marginLeft: '0.125rem' }}>→</span>
    </Link>
  )
}

// ─── Cabin filter chips ──────────────────────────────────────────────────────
// ─── Route filter chips ──────────────────────────────────────────────────────
function RouteFilter({
  available,
  active,
  onChange,
}: {
  available: Map<RouteBucket, number>
  active: RouteBucket | 'all'
  onChange: (b: RouteBucket | 'all') => void
}) {
  const opts = ROUTE_BUCKETS.filter((b) => (available.get(b.id) ?? 0) > 0)
  if (opts.length === 0) return null
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          marginBottom: '0.5rem',
        }}
      >
        Where are you flying?
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        <button
          type="button"
          onClick={() => onChange('all')}
          style={{
            ...baseChipStyle,
            cursor: 'pointer',
            padding: '0.4375rem 0.75rem',
            fontSize: '0.75rem',
            border: active === 'all' ? 'none' : '1px solid var(--color-border-soft)',
            background: active === 'all' ? 'var(--color-primary)' : '#fff',
            color: active === 'all' ? '#fff' : 'var(--color-text-primary)',
            fontWeight: active === 'all' ? 700 : 600,
          }}
        >
          All routes
        </button>
        {opts.map((opt) => {
          const isActive = active === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              title={opt.label}
              style={{
                ...baseChipStyle,
                cursor: 'pointer',
                padding: '0.4375rem 0.75rem',
                fontSize: '0.75rem',
                border: isActive ? 'none' : '1px solid var(--color-border-soft)',
                background: isActive ? 'var(--color-primary)' : '#fff',
                color: isActive ? '#fff' : 'var(--color-text-primary)',
                fontWeight: isActive ? 700 : 600,
                gap: '0.25rem',
              }}
            >
              <span style={{ marginRight: '0.125rem' }}>{opt.emoji}</span>
              {opt.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Route-aware spotlight (per-cabin best within selected route) ────────────
function RouteAwareSpotlight({
  rows,
  side,
  route,
}: {
  rows: PartnerRedemptionWithPrograms[]
  side: 'asCurrency' | 'asOperating'
  route: RouteBucket
}) {
  const bucketLabel = ROUTE_BUCKETS.find((b) => b.id === route)?.label ?? route

  const cheapestByCabin = useMemo(() => {
    const map = new Map<RedemptionCabin, PartnerRedemptionWithPrograms>()
    for (const r of rows) {
      const c = r.cost_miles_low ?? r.cost_miles_high
      if (c == null) continue
      const cur = map.get(r.cabin)
      const curCost = cur ? (cur.cost_miles_low ?? cur.cost_miles_high ?? Infinity) : Infinity
      if (c < curCost) map.set(r.cabin, r)
    }
    return CABIN_OPTIONS.filter((c) => map.has(c)).map((c) => ({ cabin: c, row: map.get(c)! }))
  }, [rows])

  if (cheapestByCabin.length === 0) {
    return (
      <p
        style={{
          margin: '0 0 1rem',
          padding: '0.875rem 1rem',
          background: 'var(--color-background-soft)',
          border: '1px dashed var(--color-border-soft)',
          borderRadius: 'var(--radius-card)',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        No published rates yet for {bucketLabel} on this airline.
      </p>
    )
  }

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '1rem 1.125rem',
        background: 'linear-gradient(135deg, #FEF9E7 0%, #FFF 70%)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-accent-hover)',
          marginBottom: '0.5rem',
        }}
      >
        ✨ Cheapest options · {bucketLabel}
      </div>
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        {cheapestByCabin.map(({ cabin, row }) => {
          const cp = side === 'asCurrency' ? row.operating_carrier : row.currency_program
          const cost = formatCost(row.cost_miles_low, row.cost_miles_high, row.pricing_model)
          return (
            <div
              key={cabin}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  ...baseChipStyle,
                  background: CABIN_BG[cabin],
                  color: CABIN_FG[cabin],
                }}
              >
                {cabin}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-primary)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                }}
              >
                {cost} miles
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {side === 'asCurrency' ? 'on' : 'via'}{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  {cp?.name ?? 'Unknown'}
                </strong>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CabinFilter({
  available,
  active,
  onChange,
}: {
  available: Set<RedemptionCabin>
  active: RedemptionCabin | 'all'
  onChange: (c: RedemptionCabin | 'all') => void
}) {
  const opts: ('all' | RedemptionCabin)[] = ['all', ...CABIN_OPTIONS.filter((c) => available.has(c))]
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
      {opts.map((opt) => {
        const isActive = active === opt
        const label = opt === 'all' ? 'All cabins' : opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              ...baseChipStyle,
              cursor: 'pointer',
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              border: isActive ? 'none' : '1px solid var(--color-border-soft)',
              background: isActive ? 'var(--color-primary)' : '#fff',
              color: isActive ? '#fff' : 'var(--color-text-primary)',
              fontWeight: isActive ? 700 : 600,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Search input ────────────────────────────────────────────────────────────
function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        maxWidth: '22rem',
        padding: '0.5rem 0.75rem',
        fontSize: '1rem',
        fontFamily: 'var(--font-body)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-ui)',
        background: '#fff',
        marginBottom: '1rem',
      }}
    />
  )
}

// ─── Group by counterparty + sort ────────────────────────────────────────────
type Group = {
  slug: string
  name: string
  alliance: Alliance | null
  rows: PartnerRedemptionWithPrograms[]
  minCost: number
}

function groupByCounterparty(
  rows: PartnerRedemptionWithPrograms[],
  side: 'asCurrency' | 'asOperating',
): Group[] {
  const groups = new Map<string, Group>()
  for (const r of rows) {
    const cp = side === 'asCurrency' ? r.operating_carrier : r.currency_program
    const key = cp?.slug ?? '__unknown__'
    const cost = r.cost_miles_low ?? r.cost_miles_high ?? Number.MAX_SAFE_INTEGER
    const existing = groups.get(key)
    if (existing) {
      existing.rows.push(r)
      if (cost < existing.minCost) existing.minCost = cost
    } else {
      groups.set(key, {
        slug: cp?.slug ?? '',
        name: cp?.name ?? 'Unknown',
        alliance: cp?.alliance ?? null,
        rows: [r],
        minCost: cost,
      })
    }
  }
  for (const g of groups.values()) {
    g.rows.sort((a, b) => {
      const ca = CABIN_ORDER[a.cabin] ?? 99
      const cb = CABIN_ORDER[b.cabin] ?? 99
      if (ca !== cb) return ca - cb
      return (a.cost_miles_low ?? 9e9) - (b.cost_miles_low ?? 9e9)
    })
  }
  return Array.from(groups.values()).sort((a, b) => a.minCost - b.minCost)
}

// ─── One direction (forward or reverse) ──────────────────────────────────────
function DirectionBlock({
  rows,
  side,
  programName,
  programSlug,
  heading,
  subtext,
  ctaLabel,
  showAccessHeader,
  programForHeader,
}: {
  rows: PartnerRedemptionWithPrograms[]
  side: 'asCurrency' | 'asOperating'
  programName: string
  programSlug: string
  heading: string
  subtext: string
  ctaLabel: string
  showAccessHeader: boolean
  programForHeader?: Pick<Program, 'name' | 'partner_access' | 'partner_access_notes' | 'saver_search_url_template'>
}) {
  const [cabin, setCabin] = useState<RedemptionCabin | 'all'>('all')
  const [route, setRoute] = useState<RouteBucket | 'all'>('all')
  const [search, setSearch] = useState('')

  // Pre-compute route buckets per row
  const rowBuckets = useMemo(() => {
    const m = new Map<string, RouteBucket[]>()
    for (const r of rows) m.set(r.id, mapRouteToBuckets(r.region_or_route))
    return m
  }, [rows])

  const availableCabins = useMemo(() => {
    const s = new Set<RedemptionCabin>()
    for (const r of rows) s.add(r.cabin)
    return s
  }, [rows])

  const availableRoutes = useMemo(() => {
    const counts = new Map<RouteBucket, number>()
    for (const r of rows) {
      for (const b of rowBuckets.get(r.id) ?? []) {
        counts.set(b, (counts.get(b) ?? 0) + 1)
      }
    }
    return counts
  }, [rows, rowBuckets])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (cabin !== 'all' && r.cabin !== cabin) return false
      if (route !== 'all' && !(rowBuckets.get(r.id) ?? []).includes(route)) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const cp = side === 'asCurrency' ? r.operating_carrier : r.currency_program
        if (!cp?.name.toLowerCase().includes(q) && !cp?.slug.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, cabin, route, search, side, rowBuckets])

  const groups = useMemo(() => groupByCounterparty(filteredRows, side), [filteredRows, side])

  if (rows.length === 0) return null

  return (
    <section
      id={side === 'asCurrency' ? 'redemptions-spend' : 'redemptions-book'}
      style={{ marginBottom: '2.5rem', scrollMarginTop: '2rem' }}
    >
      <ToolCTAPill operatorSlug={programSlug} label={ctaLabel} />
      <h2 style={headingStyle}>{heading}</h2>
      <p style={subtextStyle}>{subtext}</p>

      {showAccessHeader && programForHeader && (
        <OperatorAccessHeader program={programForHeader} />
      )}

      <RouteFilter available={availableRoutes} active={route} onChange={setRoute} />
      {route !== 'all' && (
        <RouteAwareSpotlight rows={filteredRows} side={side} route={route} />
      )}
      {route === 'all' && (
        <p
          style={{
            margin: '0 0 1rem',
            padding: '0.875rem 1rem',
            background: 'var(--color-background-soft)',
            border: '1px dashed var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: 'var(--color-primary)' }}>Pick a route above</strong>{' '}
          to see the cheapest option for the trip you&apos;re actually planning.
          Award rates vary dramatically by region — short-haul vs transatlantic vs Asia.
        </p>
      )}

      <CabinFilter available={availableCabins} active={cabin} onChange={setCabin} />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={
          side === 'asCurrency'
            ? `Search partner airlines (e.g. ${programName === 'American AAdvantage' ? 'Cathay, Qatar, JAL' : 'airline name'})`
            : `Search booking programs (e.g. Atmos, BA Avios, Aeroplan)`
        }
      />

      {groups.length === 0 ? (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
          }}
        >
          No matches for the current filter.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {groups.map((g) => {
            const tone = allianceTone(g.alliance)
            return (
              <div key={g.slug || g.name}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.125rem',
                      color: 'var(--color-primary)',
                      margin: 0,
                    }}
                  >
                    {g.slug ? <Link href={`/programs/${g.slug}`}>{g.name}</Link> : g.name}
                  </h3>
                  <span
                    style={{
                      ...baseChipStyle,
                      background: tone.color,
                      color: '#fff',
                    }}
                  >
                    {tone.label}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {g.rows.map((r) => (
                    <CardRow key={r.id} r={r} side={side} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── Top-level ───────────────────────────────────────────────────────────────
export default function PartnerRedemptionsSection({
  programName,
  programSlug,
  program,
  asCurrency,
  asOperatingCarrier,
}: {
  programName: string
  /** Operator slug for the CTA link (/tools/ways-to-book?operator=<slug>). */
  programSlug?: string
  program?: Pick<Program, 'name' | 'partner_access' | 'partner_access_notes' | 'saver_search_url_template'>
  asCurrency: PartnerRedemptionWithPrograms[]
  asOperatingCarrier: PartnerRedemptionWithPrograms[]
}) {
  if (asCurrency.length === 0 && asOperatingCarrier.length === 0) return null
  const slug = programSlug ?? ''

  return (
    <>
      {asCurrency.length > 0 && (
        <DirectionBlock
          rows={asCurrency}
          side="asCurrency"
          programName={programName}
          programSlug={slug}
          heading={`Where to spend your ${programName} miles`}
          subtext={`${programName} books these partner airlines. Sort, filter, and click any row's airline to see how to earn miles into it.`}
          ctaLabel="Compare every option in the Ways To Book Tool"
          showAccessHeader={false}
        />
      )}

      {asOperatingCarrier.length > 0 && (
        <DirectionBlock
          rows={asOperatingCarrier}
          side="asOperating"
          programName={programName}
          programSlug={slug}
          heading={`Ways to book ${programName} flights`}
          subtext={`Loyalty programs that price ${programName} award seats. The cheapest chart isn't always the best program — different partners see different award space.`}
          ctaLabel={`Open the Ways To Book Tool for ${programName}`}
          showAccessHeader={true}
          programForHeader={program}
        />
      )}
    </>
  )
}
