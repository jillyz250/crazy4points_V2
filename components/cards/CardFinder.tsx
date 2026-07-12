'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { FinderCard } from '@/utils/supabase/queries'
import { type SortKey, SORT_OPTIONS, FEE_BANDS, cardInFeeBands, sortCards } from '@/utils/cards/finder'

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

// Composite keys used by PRESETS only — resolvable via benefitByKey but NOT
// rendered as user chips. "Any travel credit" spans the flexible annual credit
// AND the category-specific airline/hotel/flight credits, so flagship cards
// like The Platinum Card from American Express (which has a $200 airline + $600
// hotel credit but no auto-applying annual travel credit) still qualify as
// premium travel cards.
const INTERNAL_BENEFITS: BenefitFilter[] = [
  { key: 'travel_credit_any', label: 'Any travel credit', types: ['travel_credit_annual', 'airline_credit', 'hotel_credit', 'flight_credit'] },
]
// The high-intent benefits surfaced as live quick chips in the Explore bar.
// Everything else stays one tap away behind "More filters". Keys map to
// ALL_BENEFITS so labels and matching stay in sync with the full panel.
const QUICK_BENEFIT_KEYS = ['lounge', 'free_night', 'hotel_status', 'free_bag', 'travel_credit', 'global_entry', 'trip_insurance', 'rental_car', 'cellphone', 'transfer_partners']
function cardHas(c: FinderCard, b: BenefitFilter): boolean {
  if (b.feature) return c.features.includes(b.feature)
  return !!b.types && b.types.some((t) => c.benefitTypes.includes(t))
}

// Earn-rate category slugs -> human labels.
const EARN_LABELS: Record<string, string> = {
  travel_through_portal: 'travel (portal)', rotating_quarterly: 'rotating (activate)',
  drug_stores: 'drugstores', grocery_stores: 'groceries', gas_stations: 'gas',
  dining: 'dining', travel: 'travel', base: 'everything else', streaming: 'streaming',
  online_retail: 'online shopping', transit: 'transit', office_supply_stores: 'office supply',
}
function earnLabel(cat: string): string {
  return EARN_LABELS[cat] ?? cat.replace(/_/g, ' ')
}
function formatBonus(amount: number, currency: string): string {
  return currency === 'USD' ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()} ${currency}`
}

// "Earns bonus on…" — canonical spend categories mapped to the messy earn-rate
// category slugs. A card matches if it earns >1x in any mapped category.
const EARN_CATEGORIES: Array<{ key: string; label: string; cats: string[] }> = [
  { key: 'dining', label: 'Dining & restaurants', cats: ['dining', 'dining_other', 'dining_citi_nights'] },
  { key: 'groceries', label: 'Groceries', cats: ['groceries', 'online_grocery', 'groceries_us_supermarkets'] },
  { key: 'gas', label: 'Gas & EV charging', cats: ['gas', 'gas_stations', 'ev_charging'] },
  { key: 'flights', label: 'Flights', cats: ['flights', 'airfare_portal', 'airline', 'airline_tickets'] },
  { key: 'hotels', label: 'Hotels', cats: ['hotels', 'hotels_through_portal', 'marriott', 'ihg', 'hyatt', 'hyatt_purchases'] },
  { key: 'travel', label: 'Travel (general / portal)', cats: ['travel', 'travel_through_portal', 'car_rentals', 'car_rentals_through_portal', 'hotels_cars_attractions_portal'] },
  { key: 'streaming', label: 'Streaming & media', cats: ['streaming', 'internet_phone_tv'] },
  { key: 'transit', label: 'Transit & commuting', cats: ['transit', 'local_transit'] },
  { key: 'rideshare', label: 'Rideshare & food delivery', cats: ['lyft', 'doordash'] },
  { key: 'drugstores', label: 'Drugstores', cats: ['drug_stores'] },
  { key: 'fitness', label: 'Fitness / gym', cats: ['fitness_gym', 'fitness_clubs', 'peloton'] },
  { key: 'office', label: 'Office & advertising (business)', cats: ['office_supplies', 'advertising', 'marketing', 'shipping', 'business_purchases'] },
]
function cardEarnsOn(c: FinderCard, key: string): boolean {
  const e = EARN_CATEGORIES.find((x) => x.key === key)
  return !!e && e.cats.some((cat) => c.bonusCategories.includes(cat))
}

const NETWORKS = [['visa', 'Visa'], ['mastercard', 'Mastercard'], ['amex', 'Amex']] as const

interface Filters {
  target: string
  cardType: 'all' | 'personal' | 'business'
  maxFee: number
  feeBands: string[]
  networks: string[]
  benefits: string[]
  earns: string[]
  issuers: string[]
  noFx: boolean
  q: string
}

// Presets (locked, Explorer spec §3.5) — curated one-tap starting points.
// Thin wrappers over the real taxonomy: each just pre-applies filter values.
const PRESETS: Array<{ key: string; label: string; filters: Partial<Filters> }> = [
  { key: 'no_fee', label: 'No annual fee', filters: { feeBands: ['f0'] } },
  { key: 'first_travel', label: 'First travel card', filters: { feeBands: ['f0', 'f95'], noFx: true, benefits: ['transfer_partners'] } },
  { key: 'premium', label: 'Premium travel', filters: { benefits: ['lounge', 'travel_credit_any'] } },
  { key: 'lounges', label: 'Best for lounges', filters: { benefits: ['lounge'] } },
  { key: 'hotels', label: 'Best for hotels', filters: { benefits: ['free_night'] } },
  { key: 'transfers', label: 'Transfers to airline partners', filters: { benefits: ['transfer_partners'] } },
]

export interface ProgramOption { slug: string; name: string }

export interface FinderInitial {
  target?: string
  benefits?: string[]
  earns?: string[]
  maxFee?: number
  cardType?: 'personal' | 'business'
}

export default function CardFinder({
  cards, programOptions, transferSources, initial,
}: {
  cards: FinderCard[]
  programOptions: ProgramOption[]
  transferSources: Record<string, string[]>
  /** Pre-applied filters from URL params (deep links from /start-here etc.). */
  initial?: FinderInitial
}) {
  const feeMax = useMemo(() => Math.max(...cards.map((c) => c.annualFee ?? 0), 0), [cards])
  const defaults: Filters = useMemo(() => ({
    target: initial?.target ?? '',
    cardType: initial?.cardType ?? 'all',
    maxFee: initial?.maxFee ?? feeMax,
    feeBands: [],
    networks: [],
    benefits: initial?.benefits ?? [],
    earns: initial?.earns ?? [],
    issuers: [],
    noFx: false,
    q: '',
  }), [feeMax, initial])

  const [showFilters, setShowFilters] = useState(false)
  // `draft` = what the Advanced-filters panel edits; `applied` = what the grid
  // shows. The panel commits draft→applied on Search. The Explore bar's quick
  // filters and sort apply LIVE — they write straight to `applied` (and mirror
  // into `draft` so the panel stays in sync). Spec §2.1.
  const [draft, setDraft] = useState<Filters>(defaults)
  const [applied, setApplied] = useState<Filters>(defaults)
  const [sort, setSort] = useState<SortKey>('relevance')
  // Which preset (if any) the current filters came from — for chip highlighting.
  // Cleared the moment the user touches any individual filter.
  const [activePreset, setActivePreset] = useState<string | null>(null)
  // Compare tray: up to 3 selected card ids + whether the comparison view is open.
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const resultsRef = useRef<HTMLParagraphElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const openPanel = () => { setShowFilters(true); requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }

  const allIssuers = useMemo(() => Array.from(new Set(cards.map((c) => c.issuerName).filter(Boolean))).sort(), [cards])
  const benefitByKey = useMemo(() => new Map([...ALL_BENEFITS, ...INTERNAL_BENEFITS].map((b) => [b.key, b])), [])
  const setD = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }))
  // Quick filters apply immediately: write to `applied` (drives the grid) and
  // mirror into `draft` so the Advanced panel reflects them when opened.
  const applyLive = (patch: Partial<Filters>) => {
    setApplied((a) => ({ ...a, ...patch }))
    setDraft((d) => ({ ...d, ...patch }))
    setActivePreset(null)
  }
  // Presets replace the whole filter state (a fresh starting point). Clicking
  // the active preset again clears it. Quick filters/Search/Clear drop the tag.
  const applyPreset = (p: (typeof PRESETS)[number]) => {
    if (activePreset === p.key) { reset(); return }
    const next: Filters = { ...defaults, ...p.filters }
    setApplied(next); setDraft(next); setActivePreset(p.key)
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  const passes = (c: FinderCard, f: Filters) => {
    const ql = f.q.trim().toLowerCase()
    const selected = f.benefits.map((k) => benefitByKey.get(k)!).filter(Boolean)
    if (f.cardType !== 'all' && c.cardType !== f.cardType) return false
    // Fee cap: a known fee must be within it. When a cap is set, exclude
    // unknown-fee (unauthored) cards rather than treating them as $0.
    if (f.maxFee < feeMax && (c.annualFee == null || c.annualFee > f.maxFee)) return false
    if (!cardInFeeBands(c.annualFee, f.feeBands)) return false
    if (f.networks.length && (!c.network || !f.networks.includes(c.network))) return false
    if (f.noFx && !c.noFxFee) return false
    if (f.issuers.length && !f.issuers.includes(c.issuerName)) return false
    if (selected.length && !selected.every((b) => cardHas(c, b))) return false
    if (f.earns.length && !f.earns.every((k) => cardEarnsOn(c, k))) return false
    if (ql && !`${c.name} ${c.issuerName}`.toLowerCase().includes(ql)) return false
    return true
  }

  const base = useMemo(() => sortCards(cards.filter((c) => passes(c, applied)), sort), [cards, applied, sort]) // eslint-disable-line react-hooks/exhaustive-deps
  const draftCount = useMemo(() => cards.filter((c) => passes(c, draft)).length, [cards, draft]) // eslint-disable-line react-hooks/exhaustive-deps
  const search = () => { setApplied(draft); setShowFilters(false); setActivePreset(null); requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  const reset = () => { setDraft(defaults); setApplied(defaults); setSort('relevance'); setActivePreset(null) }

  const grouped = useMemo(() => {
    if (!applied.target) return null
    const sources = new Set(transferSources[applied.target] ?? [])
    const direct: FinderCard[] = []; const transfer: FinderCard[] = []
    for (const c of base) {
      if (c.coBrand?.slug === applied.target || c.currency?.slug === applied.target) direct.push(c)
      else if (c.currency && sources.has(c.currency.slug) && c.transferEligibility !== 'none') transfer.push(c)
    }
    // `base` is already sorted; preserve that order within each group.
    return { direct, transfer }
  }, [base, applied.target, transferSources]) // eslint-disable-line react-hooks/exhaustive-deps

  const targetName = programOptions.find((p) => p.slug === applied.target)?.name ?? ''
  const resultCount = grouped ? grouped.direct.length + grouped.transfer.length : base.length
  const activeFilters = (applied.target ? 1 : 0) + (applied.cardType !== 'all' ? 1 : 0) + (applied.maxFee < feeMax ? 1 : 0) + applied.feeBands.length + applied.networks.length + applied.benefits.length + applied.earns.length + applied.issuers.length + (applied.noFx ? 1 : 0)
  // Anything that "Clear all" would undo — active filters or a non-default sort.
  const hasActive = activeFilters > 0 || sort !== 'relevance'

  const compareFull = compareIds.length >= 3
  const toggleCompare = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= 3 ? ids : [...ids, id]))
  const compareApi = { has: (id: string) => compareIds.includes(id), full: compareFull, toggle: toggleCompare }
  const compareCards = compareIds.map((id) => cards.find((c) => c.id === id)).filter(Boolean) as FinderCard[]

  return (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 1fr)' }}>
      {/* Presets — curated one-tap starting points for "I don't know exactly what I want." */}
      <div>
        <div style={{ ...labelStyle, marginBottom: '0.625rem' }}>Popular starting points</div>
        <div style={chipRow}>
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => applyPreset(p)} className="rg-tap-target"
              style={activePreset === p.key ? presetChipOn : presetChip}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Explore bar — the primary surface. Sort + quick filters apply live. */}
      <div style={exploreBar}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="card-sort" style={{ ...labelStyle, margin: 0 }}>Sort by</label>
            <select id="card-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ ...inputStyle, width: 'auto', minWidth: '13rem' }}>
              {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
          {hasActive && (
            <button onClick={reset} style={clearAllBtn} className="rg-tap-target">Clear all filters</button>
          )}
        </div>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={chipRow}>
            {(['all', 'personal', 'business'] as const).map((t) => (
              <Chip key={t} on={applied.cardType === t} onClick={() => applyLive({ cardType: t })}>{t === 'all' ? 'All cards' : t[0].toUpperCase() + t.slice(1)}</Chip>
            ))}
          </div>
          <div style={chipRow}>
            {FEE_BANDS.map((b) => (
              <Chip key={b.key} on={applied.feeBands.includes(b.key)} onClick={() => applyLive({ feeBands: toggle(applied.feeBands, b.key) })}>{b.label}</Chip>
            ))}
            <Chip on={applied.noFx} onClick={() => applyLive({ noFx: !applied.noFx })}>No foreign fee</Chip>
          </div>
          <div style={chipRow}>
            {QUICK_BENEFIT_KEYS.map((k) => {
              const b = benefitByKey.get(k)
              if (!b) return null
              return <Chip key={k} on={applied.benefits.includes(k)} onClick={() => applyLive({ benefits: toggle(applied.benefits, k) })}>{b.label}</Chip>
            })}
            <button onClick={openPanel} style={moreFiltersLink} className="rg-tap-target">All filters →</button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div ref={panelRef} style={{ ...panel, display: 'grid', gap: '1.25rem', scrollMarginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', margin: 0 }}>Advanced filters</h2>
            <button onClick={() => setShowFilters(false)} style={clearBtn} aria-label="Close advanced filters">Done</button>
          </div>
          <Field label="Points program (optional)">
            <select value={draft.target} onChange={(e) => setD({ target: e.target.value })} style={inputStyle}>
              <option value="">Any program</option>
              {programOptions.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Search">
            <input value={draft.q} onChange={(e) => setD({ q: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') search() }} placeholder="Card or issuer name" style={inputStyle} />
          </Field>

          <Field label="Card type">
            <div style={chipRow}>
              {(['all', 'personal', 'business'] as const).map((t) => (
                <Chip key={t} on={draft.cardType === t} onClick={() => setD({ cardType: t })}>{t === 'all' ? 'All' : t[0].toUpperCase() + t.slice(1)}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Annual fee">
            <div style={chipRow}>
              {FEE_BANDS.map((b) => (
                <Chip key={b.key} on={draft.feeBands.includes(b.key)} onClick={() => setD({ feeBands: toggle(draft.feeBands, b.key) })}>{b.label}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Benefits (card must have all selected)">
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              {BENEFIT_GROUPS.map((g) => (
                <div key={g.group}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.4375rem' }}>{g.group}</div>
                  <div style={chipRow}>
                    {g.items.map((b) => (
                      <Chip key={b.key} on={draft.benefits.includes(b.key)} onClick={() => setD({ benefits: toggle(draft.benefits, b.key) })}>{b.label}</Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Field>

          <Field label="Earns bonus points on (all selected)">
            <div style={chipRow}>
              {EARN_CATEGORIES.map((e) => (
                <Chip key={e.key} on={draft.earns.includes(e.key)} onClick={() => setD({ earns: toggle(draft.earns, e.key) })}>{e.label}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Network">
            <div style={chipRow}>
              {NETWORKS.map(([v, lbl]) => (
                <Chip key={v} on={draft.networks.includes(v)} onClick={() => setD({ networks: toggle(draft.networks, v) })}>{lbl}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Issuer">
            <div style={chipRow}>
              {allIssuers.map((i) => (
                <Chip key={i} on={draft.issuers.includes(i)} onClick={() => setD({ issuers: toggle(draft.issuers, i) })}>{i}</Chip>
              ))}
            </div>
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} className="rg-tap-target">
            <input type="checkbox" checked={draft.noFx} onChange={(e) => setD({ noFx: e.target.checked })} style={{ width: 18, height: 18 }} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.9375rem' }}>No foreign transaction fee</span>
          </label>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={search} style={searchBtn} className="rg-tap-target">
              Search — show {draftCount} {draftCount === 1 ? 'card' : 'cards'}
            </button>
            <button onClick={reset} style={clearBtn}>Clear filters</button>
          </div>
        </div>
      )}

      <p ref={resultsRef} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0, scrollMarginTop: '1rem' }}>
        {resultCount} {resultCount === 1 ? 'card' : 'cards'}{applied.target ? ` for ${targetName}` : ''}
      </p>

      {grouped ? (
        <>
          <Group title={`Earns ${targetName} directly`} subtitle="Co-branded cards (and cards that earn this currency outright)." cards={grouped.direct} compare={compareApi} />
          <Group title={`Transfers to ${targetName}`} subtitle="Flexible-points cards whose currency transfers in. Some require pairing with a premium sibling card." cards={grouped.transfer} showTransferNote compare={compareApi} />
          {resultCount === 0 && <Empty />}
        </>
      ) : (
        <div style={grid}>{base.map((c) => <CardTile key={c.id} c={c} compare={compareApi} />)}{base.length === 0 && <Empty />}</div>
      )}

      {/* Sticky compare tray — appears once at least one card is selected. */}
      {compareCards.length > 0 && (
        <div style={compareTray}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Compare ({compareCards.length}/3)</span>
            {compareCards.map((c) => (
              <span key={c.id} style={compareTrayChip}>
                {c.name}
                <button onClick={() => toggleCompare(c.id)} aria-label={`Remove ${c.name}`} style={compareTrayRemove}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setCompareOpen(true)} disabled={compareCards.length < 2} style={{ ...searchBtn, opacity: compareCards.length < 2 ? 0.5 : 1, cursor: compareCards.length < 2 ? 'default' : 'pointer' }} className="rg-tap-target">Compare</button>
            <button onClick={() => setCompareIds([])} style={clearBtn}>Clear</button>
          </div>
        </div>
      )}

      {compareOpen && <CompareOverlay cards={compareCards} benefitByKey={benefitByKey} onRemove={toggleCompare} onClose={() => setCompareOpen(false)} />}
    </div>
  )
}

type CompareApi = { has: (id: string) => boolean; full: boolean; toggle: (id: string) => void }

function Group({ title, subtitle, cards, showTransferNote, compare }: { title: string; subtitle: string; cards: FinderCard[]; showTransferNote?: boolean; compare?: CompareApi }) {
  if (cards.length === 0) return null
  return (
    <section>
      <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem' }}>{title} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: '1rem' }}>({cards.length})</span></h2>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>{subtitle}</p>
      <div style={grid}>{cards.map((c) => <CardTile key={c.id} c={c} showTransferNote={showTransferNote} compare={compare} />)}</div>
    </section>
  )
}

function CardTile({ c, showTransferNote, compare }: { c: FinderCard; showTransferNote?: boolean; compare?: CompareApi }) {
  // Not fully authored yet -> greyed, non-clickable "coming soon" tile.
  if (!c.authored) {
    return (
      <div style={{ ...tile, position: 'relative', cursor: 'default', opacity: 0.62 }} aria-label={`${c.name} (coming soon)`}>
        <span style={comingSoonBadge}>Coming soon</span>
        <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
          {c.issuerName}{c.network ? ` · ${c.network[0].toUpperCase() + c.network.slice(1)}` : ''}
        </div>
        <div style={{ fontWeight: 600, fontSize: '1.0625rem', lineHeight: 1.3, color: 'var(--color-text-secondary)' }}>{c.name}</div>
      </div>
    )
  }
  const pool = showTransferNote && c.transferEligibility === 'pool_to_unlock'
  // Show the specific benefits THIS card has, from our recognizable taxonomy.
  const has = ALL_BENEFITS.filter((b) => cardHas(c, b)).slice(0, 5)
  const comparing = compare?.has(c.id) ?? false
  const compareDisabled = !comparing && (compare?.full ?? false)
  return (
    <Link href={`/cards/${c.slug}`} style={tile}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
        <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {c.issuerName}{c.network ? ` · ${c.network[0].toUpperCase() + c.network.slice(1)}` : ''}
        </div>
        {compare && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!compareDisabled) compare.toggle(c.id) }}
            disabled={compareDisabled}
            aria-pressed={comparing}
            title={compareDisabled ? 'Comparing 3 cards already' : comparing ? 'Remove from compare' : 'Add to compare'}
            style={comparing ? compareTileBtnOn : { ...compareTileBtn, opacity: compareDisabled ? 0.4 : 1, cursor: compareDisabled ? 'default' : 'pointer' }}
          >
            {comparing ? '✓ Comparing' : '+ Compare'}
          </button>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: '1.0625rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{c.name}</div>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: (has.length || c.topEarn.length) ? '0.625rem' : 0 }}>
        <Stat label="Annual fee" value={c.annualFee === 0 ? '$0' : c.annualFee != null ? `$${c.annualFee}` : 'See card'} />
        {c.sub && <Stat label="Welcome bonus" value={formatBonus(c.sub.bonus_amount, c.sub.bonus_currency)} />}
        {c.noFxFee && <Stat label="FX fee" value="None" />}
      </div>
      {c.topEarn.length > 0 && (
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginBottom: has.length ? '0.625rem' : 0 }}>
          {c.topEarn.map((e) => `${e.multiplier % 1 === 0 ? e.multiplier : e.multiplier.toFixed(1)}x ${earnLabel(e.category)}`).join(' · ')}
        </div>
      )}
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

// Attribute-first comparison (Explorer spec §3.4): rows are attributes, the
// 2–3 cards are columns on desktop and stack on mobile (card name shown per
// cell only when stacked, via the rg-compare-* CSS in globals.css).
function CompareOverlay({ cards, benefitByKey, onRemove, onClose }: {
  cards: FinderCard[]; benefitByKey: Map<string, BenefitFilter>; onRemove: (id: string) => void; onClose: () => void
}) {
  const [highlight, setHighlight] = useState(true)
  const lounge = benefitByKey.get('lounge')
  const fmtMult = (m: number) => (m % 1 === 0 ? `${m}` : m.toFixed(1))
  const colStyle = { '--cmp-cols': String(cards.length) } as React.CSSProperties
  const attrs: Array<{ label: string; get: (c: FinderCard) => string }> = [
    { label: 'Annual fee', get: (c) => (c.annualFee === 0 ? '$0' : c.annualFee != null ? `$${c.annualFee}` : '—') },
    { label: 'Welcome bonus', get: (c) => (c.sub ? formatBonus(c.sub.bonus_amount, c.sub.bonus_currency) : '—') },
    { label: 'Top earn rate', get: (c) => (c.topEarn.length ? c.topEarn.map((e) => `${fmtMult(e.multiplier)}x ${earnLabel(e.category)}`).join(', ') : '—') },
    { label: 'Lounge access', get: (c) => (lounge && cardHas(c, lounge) ? 'Yes' : 'No') },
    { label: 'No foreign fee', get: (c) => (c.noFxFee ? 'Yes' : 'No') },
    { label: 'Transfers to partners', get: (c) => (c.benefitTypes.includes('transfer_partner_access') || (c.transferEligibility && c.transferEligibility !== 'none') ? 'Yes' : 'No') },
  ]
  return (
    <div style={compareOverlay} role="dialog" aria-modal="true" aria-label="Compare cards" onClick={onClose}>
      <div style={compareModal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Compare cards</h2>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', cursor: 'pointer' }} className="rg-tap-target">
              <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} style={{ width: 16, height: 16 }} />
              Highlight differences
            </label>
            <button onClick={onClose} style={searchBtn} className="rg-tap-target">Back to cards</button>
          </div>
        </div>

        {/* Card header row */}
        <div className="rg-compare-vals" style={{ ...colStyle, marginBottom: '0.25rem' }}>
          {cards.map((c) => (
            <div key={c.id} style={{ paddingBottom: '0.5rem' }}>
              <Link href={`/cards/${c.slug}`} style={{ display: 'block', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.9375rem', lineHeight: 1.3 }}>{c.name}</Link>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', margin: '0.125rem 0 0.375rem' }}>{c.issuerName}</div>
              <button onClick={() => onRemove(c.id)} style={clearBtn}>Remove</button>
            </div>
          ))}
        </div>

        {attrs.map((a) => {
          const vals = cards.map(a.get)
          const differs = new Set(vals).size > 1
          return (
            <div key={a.label} style={{ borderTop: '1px solid var(--color-border-soft)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-ui)', background: highlight && differs ? 'var(--color-background-soft)' : 'transparent' }}>
              <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>{a.label}</div>
              <div className="rg-compare-vals" style={colStyle}>
                {cards.map((c, i) => (
                  <div key={c.id} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    <span className="rg-compare-cardname" style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '0.125rem' }}>{c.name}</span>
                    {vals[i]}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const panel: React.CSSProperties = { border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', background: 'var(--color-background-soft)', padding: '1.125rem' }
const exploreBar: React.CSSProperties = { display: 'grid', gap: '0.875rem', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', background: 'var(--color-background)', padding: '1rem 1.125rem', boxShadow: 'var(--shadow-soft)' }
const comingSoonBadge: React.CSSProperties = { position: 'absolute', top: '0.625rem', right: '0.625rem', fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', borderRadius: '999px', padding: '0.1875rem 0.5rem' }
const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', display: 'block' }
const inputStyle: React.CSSProperties = { width: '100%', fontSize: '1rem', fontFamily: 'var(--font-ui)', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border-soft)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }
const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem' }
const tile: React.CSSProperties = { display: 'block', padding: '1rem 1.125rem', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', background: 'var(--color-background)', textDecoration: 'none', color: 'var(--color-text-primary)' }
const famBadge: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', padding: '0.1875rem 0.5rem', borderRadius: '999px', background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', color: 'var(--color-text-secondary)' }
const clearBtn: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', justifySelf: 'start', padding: 0, textDecoration: 'underline' }
const searchBtn: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.9375rem', fontWeight: 700, padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-ui)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', minHeight: 44 }
const clearAllBtn: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.9375rem', fontWeight: 700, padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-chip-red)', background: 'var(--color-chip-red-bg)', color: 'var(--color-chip-red-fg)', cursor: 'pointer', minHeight: 44 }
// Compare — tile button, sticky tray, comparison overlay.
const compareTileBtn: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '999px', border: '1px solid var(--color-border-soft)', background: 'var(--color-background)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }
const compareTileBtnOn: React.CSSProperties = { ...compareTileBtn, border: '1px solid var(--color-primary)', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer' }
const compareTray: React.CSSProperties = { position: 'sticky', bottom: '0.75rem', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem 1rem', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border-soft)', background: 'var(--color-background)', boxShadow: '0 4px 16px rgba(26,26,26,0.12)' }
const compareTrayChip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', padding: '0.25rem 0.25rem 0.25rem 0.625rem', borderRadius: '999px', background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', maxWidth: '14rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const compareTrayRemove: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '999px', border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1, cursor: 'pointer', flexShrink: 0 }
const compareOverlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(26,26,26,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }
const compareModal: React.CSSProperties = { width: '100%', maxWidth: '52rem', margin: 'auto', background: 'var(--color-background)', borderRadius: 'var(--radius-card)', padding: '1.5rem', boxShadow: '0 8px 32px rgba(26,26,26,0.2)' }
const moreFiltersLink: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 700, padding: '0.4375rem 0.75rem', borderRadius: '999px', minHeight: 36, border: '1px dashed var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer' }
// Presets read as curated shortcuts, not filters: gold-accented pills.
const presetChip: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 700, padding: '0.5rem 0.875rem', borderRadius: '999px', minHeight: 38, cursor: 'pointer', border: '1px solid var(--color-accent)', background: 'var(--color-background)', color: 'var(--color-text-primary)' }
const presetChipOn: React.CSSProperties = { ...presetChip, background: 'var(--color-accent)', color: '#1A1A1A' }
