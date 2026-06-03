'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { FinderCard } from '@/utils/supabase/queries'

// Specific, recognizable benefits — the things that actually sell a card.
// Each maps to one or more benefit_type values (or a description-derived feature).
interface BenefitFilter { key: string; label: string; types?: string[]; feature?: string }
const BENEFIT_GROUPS: Array<{ group: string; items: BenefitFilter[] }> = [
  { group: 'Hotel', items: [
    { key: 'free_night', label: 'Annual free night', types: ['free_night_award', 'free_night_after_spend'] },
    { key: 'hotel_status', label: 'Hotel elite status', types: ['status_marriott_gold', 'status_marriott_silver', 'status_marriott_platinum', 'status_hilton_gold', 'status_hyatt_discoverist', 'status_hyatt_explorist', 'status_ihg_diamond', 'status_ihg_platinum', 'status_ihg_gold', 'status_ihg_silver'] },
    { key: 'late_checkout', label: 'Late checkout', feature: 'late_checkout' },
    { key: 'hotel_credit', label: 'Hotel credit', types: ['hotel_credit'] },
  ]},
  { group: 'Airline', items: [
    { key: 'free_bag', label: 'Free checked bag', types: ['free_checked_bag'] },
    { key: 'priority_boarding', label: 'Priority boarding', types: ['priority_boarding'] },
    { key: 'companion', label: 'Companion pass / certificate', types: ['companion_pass', 'status_southwest_companion_pass'] },
    { key: 'airline_credit', label: 'Airline fee credit', types: ['airline_credit', 'flight_credit'] },
  ]},
  { group: 'Lounge', items: [
    { key: 'lounge', label: 'Lounge access', types: ['lounge_priority_pass', 'lounge_centurion', 'lounge_united_club', 'lounge_skyclub', 'lounge_other'] },
    { key: 'priority_pass', label: 'Priority Pass', types: ['lounge_priority_pass'] },
  ]},
  { group: 'Credits', items: [
    { key: 'travel_credit', label: 'Annual travel credit', types: ['travel_credit_annual'] },
    { key: 'global_entry', label: 'Global Entry / TSA credit', types: ['global_entry_credit'] },
    { key: 'dining_credit', label: 'Dining credit', types: ['dining_credit'] },
    { key: 'rideshare_food', label: 'Rideshare / food-delivery credit', types: ['uber_credit', 'lyft_credit', 'doordash_credit'] },
    { key: 'entertainment', label: 'Entertainment / streaming credit', types: ['entertainment_credit', 'streaming_credit'] },
  ]},
  { group: 'Insurance', items: [
    { key: 'trip_insurance', label: 'Trip cancellation / delay insurance', types: ['trip_cancellation_insurance', 'trip_delay_insurance', 'trip_interruption_insurance'] },
    { key: 'baggage', label: 'Baggage insurance', types: ['baggage_delay_insurance', 'lost_luggage_insurance'] },
    { key: 'rental_car', label: 'Rental car coverage', types: ['rental_car_cdw_primary', 'rental_car_cdw_secondary'] },
    { key: 'cellphone', label: 'Cell phone protection', types: ['cellphone_protection'] },
  ]},
  { group: 'Protection', items: [
    { key: 'purchase_protection', label: 'Purchase protection', types: ['purchase_protection'] },
    { key: 'extended_warranty', label: 'Extended warranty', types: ['extended_warranty'] },
    { key: 'return_protection', label: 'Return protection', types: ['return_protection'] },
  ]},
  { group: 'Points & transfers', items: [
    { key: 'transfer_partners', label: 'Transfers to airline/hotel partners', types: ['transfer_partner_access'] },
    { key: 'portal_bonus', label: 'Points boost on travel portal', types: ['portal_redemption_bonus'] },
  ]},
]
const ALL_BENEFITS: BenefitFilter[] = BENEFIT_GROUPS.flatMap((g) => g.items)
function cardHas(c: FinderCard, b: BenefitFilter): boolean {
  if (b.feature) return c.features.includes(b.feature)
  return !!b.types && b.types.some((t) => c.benefitTypes.includes(t))
}

const NETWORKS = [['visa', 'Visa'], ['mastercard', 'Mastercard'], ['amex', 'Amex']] as const

export interface ProgramOption { slug: string; name: string }

export default function CardFinder({
  cards, programOptions, transferSources,
}: {
  cards: FinderCard[]
  programOptions: ProgramOption[]
  transferSources: Record<string, string[]>
}) {
  const feeMax = useMemo(() => Math.max(...cards.map((c) => c.annualFee ?? 0), 0), [cards])
  const [target, setTarget] = useState('')
  const [cardType, setCardType] = useState<'all' | 'personal' | 'business'>('all')
  const [maxFee, setMaxFee] = useState(feeMax)
  const [networks, setNetworks] = useState<string[]>([])
  const [benefits, setBenefits] = useState<string[]>([])
  const [issuers, setIssuers] = useState<string[]>([])
  const [noFx, setNoFx] = useState(false)
  const [q, setQ] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const allIssuers = useMemo(() => Array.from(new Set(cards.map((c) => c.issuerName).filter(Boolean))).sort(), [cards])
  const benefitByKey = useMemo(() => new Map(ALL_BENEFITS.map((b) => [b.key, b])), [])
  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const base = useMemo(() => {
    const ql = q.trim().toLowerCase()
    const selected = benefits.map((k) => benefitByKey.get(k)!).filter(Boolean)
    return cards.filter((c) => {
      if (cardType !== 'all' && c.cardType !== cardType) return false
      if ((c.annualFee ?? 0) > maxFee) return false
      if (networks.length && (!c.network || !networks.includes(c.network))) return false
      if (noFx && !c.noFxFee) return false
      if (issuers.length && !issuers.includes(c.issuerName)) return false
      if (selected.length && !selected.every((b) => cardHas(c, b))) return false
      if (ql && !`${c.name} ${c.issuerName}`.toLowerCase().includes(ql)) return false
      return true
    })
  }, [cards, cardType, maxFee, networks, noFx, issuers, benefits, benefitByKey, q])

  const grouped = useMemo(() => {
    if (!target) return null
    const sources = new Set(transferSources[target] ?? [])
    const direct: FinderCard[] = []; const transfer: FinderCard[] = []
    for (const c of base) {
      if (c.coBrand?.slug === target || c.currency?.slug === target) direct.push(c)
      else if (c.currency && sources.has(c.currency.slug) && c.transferEligibility !== 'none') transfer.push(c)
    }
    const byFee = (a: FinderCard, b: FinderCard) => (a.annualFee ?? Infinity) - (b.annualFee ?? Infinity)
    return { direct: direct.sort(byFee), transfer: transfer.sort(byFee) }
  }, [base, target, transferSources])

  const targetName = programOptions.find((p) => p.slug === target)?.name ?? ''
  const resultCount = grouped ? grouped.direct.length + grouped.transfer.length : base.length
  const activeFilters = (cardType !== 'all' ? 1 : 0) + (maxFee < feeMax ? 1 : 0) + networks.length + benefits.length + issuers.length + (noFx ? 1 : 0)
  const reset = () => { setCardType('all'); setMaxFee(feeMax); setNetworks([]); setBenefits([]); setIssuers([]); setNoFx(false); setQ('') }

  return (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 1fr)' }}>
      <div style={panel}>
        <label style={labelStyle} htmlFor="target">I want points in…</label>
        <select id="target" value={target} onChange={(e) => setTarget(e.target.value)} style={inputStyle}>
          <option value="">Any program — show me all cards</option>
          {programOptions.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
      </div>

      <button onClick={() => setShowFilters((s) => !s)} style={filtersToggle} className="rg-tap-target">
        {showFilters ? 'Hide filters' : 'Filters'}{activeFilters ? ` (${activeFilters})` : ''}
      </button>

      {showFilters && (
        <div style={{ ...panel, display: 'grid', gap: '1.25rem' }}>
          <Field label="Search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Card or issuer name" style={inputStyle} />
          </Field>

          <Field label="Card type">
            <div style={chipRow}>
              {(['all', 'personal', 'business'] as const).map((t) => (
                <Chip key={t} on={cardType === t} onClick={() => setCardType(t)}>{t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1)}</Chip>
              ))}
            </div>
          </Field>

          <Field label={maxFee >= feeMax ? 'Max annual fee: Any' : `Max annual fee: $${maxFee}`}>
            <input type="range" min={0} max={feeMax} step={5} value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
              <span>$0</span><span>${feeMax}</span>
            </div>
          </Field>

          <Field label="Benefits (card must have all selected)">
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              {BENEFIT_GROUPS.map((g) => (
                <div key={g.group}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.4375rem' }}>{g.group}</div>
                  <div style={chipRow}>
                    {g.items.map((b) => (
                      <Chip key={b.key} on={benefits.includes(b.key)} onClick={() => toggle(benefits, b.key, setBenefits)}>{b.label}</Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Network">
            <div style={chipRow}>
              {NETWORKS.map(([v, lbl]) => (
                <Chip key={v} on={networks.includes(v)} onClick={() => toggle(networks, v, setNetworks)}>{lbl}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Issuer">
            <div style={chipRow}>
              {allIssuers.map((i) => (
                <Chip key={i} on={issuers.includes(i)} onClick={() => toggle(issuers, i, setIssuers)}>{i}</Chip>
              ))}
            </div>
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} className="rg-tap-target">
            <input type="checkbox" checked={noFx} onChange={(e) => setNoFx(e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9375rem' }}>No foreign transaction fee</span>
          </label>

          <button onClick={reset} style={clearBtn}>Clear filters</button>
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
        {resultCount} {resultCount === 1 ? 'card' : 'cards'}{target ? ` for ${targetName}` : ''}
      </p>

      {grouped ? (
        <>
          <Group title={`Earns ${targetName} directly`} subtitle="Co-branded cards (and cards that earn this currency outright)." cards={grouped.direct} />
          <Group title={`Transfers to ${targetName}`} subtitle="Flexible-points cards whose currency transfers in. Some require pairing with a premium sibling card." cards={grouped.transfer} showTransferNote />
          {resultCount === 0 && <Empty />}
        </>
      ) : (
        <div style={grid}>{base.map((c) => <CardTile key={c.id} c={c} />)}{base.length === 0 && <Empty />}</div>
      )}
    </div>
  )
}

function Group({ title, subtitle, cards, showTransferNote }: { title: string; subtitle: string; cards: FinderCard[]; showTransferNote?: boolean }) {
  if (cards.length === 0) return null
  return (
    <section>
      <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem' }}>{title} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: '1rem' }}>({cards.length})</span></h2>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>{subtitle}</p>
      <div style={grid}>{cards.map((c) => <CardTile key={c.id} c={c} showTransferNote={showTransferNote} />)}</div>
    </section>
  )
}

function CardTile({ c, showTransferNote }: { c: FinderCard; showTransferNote?: boolean }) {
  const pool = showTransferNote && c.transferEligibility === 'pool_to_unlock'
  // Show the specific benefits THIS card has, from our recognizable taxonomy.
  const has = ALL_BENEFITS.filter((b) => cardHas(c, b)).slice(0, 5)
  return (
    <Link href={`/cards/${c.slug}`} style={tile}>
      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
        {c.issuerName}{c.network ? ` · ${c.network[0].toUpperCase() + c.network.slice(1)}` : ''}
      </div>
      <div style={{ fontWeight: 600, fontSize: '1.0625rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{c.name}</div>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: has.length ? '0.625rem' : 0 }}>
        <Stat label="Annual fee" value={c.annualFee === 0 ? '$0' : c.annualFee != null ? `$${c.annualFee}` : '—'} />
        {c.sub && <Stat label="Welcome bonus" value={c.sub.bonus_amount.toLocaleString()} />}
        {c.noFxFee && <Stat label="FX fee" value="None" />}
      </div>
      {has.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3125rem' }}>
          {has.map((b) => <span key={b.key} style={famBadge}>{b.label}</span>)}
        </div>
      )}
      {pool && (
        <div style={{ marginTop: '0.625rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)' }}>
          Requires pairing with a premium sibling card to transfer.
        </div>
      )}
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ fontWeight: 600, fontFamily: 'var(--font-ui)' }}>{value}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={labelStyle}>{label}</div>{children}</div>
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', padding: '0.4375rem 0.75rem',
      borderRadius: '999px', cursor: 'pointer', minHeight: 36,
      border: `1px solid ${on ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
      background: on ? 'var(--color-primary)' : 'var(--color-background)',
      color: on ? '#fff' : 'var(--color-text-primary)',
    }}>{children}</button>
  )
}

function Empty() {
  return <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-secondary)' }}>No cards match these filters. Try clearing a few.</p>
}

const panel: React.CSSProperties = { border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', background: 'var(--color-background-soft)', padding: '1.125rem' }
const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', display: 'block' }
const inputStyle: React.CSSProperties = { width: '100%', fontSize: '1rem', fontFamily: 'var(--font-ui)', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border-soft)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }
const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem' }
const tile: React.CSSProperties = { display: 'block', padding: '1rem 1.125rem', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', background: 'var(--color-background)', textDecoration: 'none', color: 'var(--color-text-primary)' }
const famBadge: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', padding: '0.1875rem 0.5rem', borderRadius: '999px', background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', color: 'var(--color-text-secondary)' }
const filtersToggle: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.9375rem', fontWeight: 600, padding: '0.625rem 1rem', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border-soft)', background: 'var(--color-background)', color: 'var(--color-primary)', cursor: 'pointer', justifySelf: 'start' }
const clearBtn: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', justifySelf: 'start', padding: 0, textDecoration: 'underline' }
