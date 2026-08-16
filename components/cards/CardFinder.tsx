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

// ── Tiered tile look ────────────────────────────────────────────────────────
// The tile dresses itself by category, straight from the annual fee already in
// the data: Premium ($400+) wears a gold-framed obsidian face, Rewards ($1–399)
// a brand-tinted wash, Everyday ($0) a light card with a brand accent bar. No
// new data, no manual tagging.
type Tier = 'premium' | 'rewards' | 'everyday'
function cardTier(fee: number | null): Tier {
  if (fee != null && fee >= 400) return 'premium'
  if (fee != null && fee > 0) return 'rewards'
  return 'everyday'
}
// Issuer brand colors — UI accents only (not published facts). Keyed by the
// exact issuers.name value. Falls back to the site purple for anything new.
const ISSUER_BRAND: Record<string, [string, string]> = {
  'Chase': ['#1554b0', '#2f7ac4'],
  'American Express': ['#016fd0', '#1c7ed6'],
  'Citi': ['#0a4ea2', '#1a6bb5'],
  'Capital One': ['#004977', '#c8102e'],
  'Barclays': ['#0075c9', '#00a3e0'],
  'Bank of America': ['#012169', '#c8102e'],
  'US Bank': ['#0c2074', '#1746a2'],
  'Wells Fargo': ['#b31b30', '#c99a1e'],
  'Synchrony': ['#0060a9', '#00a0df'],
  'First National Bank of Omaha': ['#00447c', '#0a6cb0'],
  'First Bank & Trust': ['#003a70', '#2f7ac4'],
  'Bilt': ['#2b2b30', '#55555e'],
}
function brandFor(issuer: string): [string, string] {
  return ISSUER_BRAND[issuer] ?? ['#6B2D8F', '#9B4FC0']
}
interface TileTheme {
  tier: Tier
  frame?: string; bg: string; border: string
  rail?: string; accentBar?: string; glow?: string
  text: string; sub: string; issuerColor: string; logoBg: string
  pillBg: string; pillColor: string; pillBorder: string; accent: string
  badgeBg: string; badgeColor: string; badgeBorder: string
  cmp: React.CSSProperties; cmpOn: React.CSSProperties
  divider: string; apply: React.CSSProperties; ghost: React.CSSProperties; ftc: string
  flag: boolean
}
function tileTheme(tier: Tier, issuer: string): TileTheme {
  const [brand, brand2] = brandFor(issuer)
  if (tier === 'premium') {
    return {
      tier,
      frame: 'linear-gradient(135deg,#f6dc92 0%,#b8912f 34%,#8a6a1e 52%,#e8c877 72%,#b8912f 100%)',
      bg: 'linear-gradient(158deg,#2f2935 0%,#17141c 55%,#0c0a0f 100%)',
      border: 'transparent',
      text: '#F7F1E5', sub: 'rgba(239,231,218,0.62)', issuerColor: '#E0BC63', logoBg: '#ffffff',
      pillBg: 'linear-gradient(180deg,rgba(212,175,55,0.14),rgba(212,175,55,0))', pillColor: '#F0D488', pillBorder: 'rgba(212,175,55,0.5)', accent: '#F0D488',
      badgeBg: 'rgba(255,255,255,0.05)', badgeColor: 'rgba(239,231,218,0.82)', badgeBorder: 'rgba(212,175,55,0.28)',
      cmp: { background: 'rgba(255,255,255,0.06)', color: '#E0BC63', border: '1px solid rgba(212,175,55,0.4)' },
      cmpOn: { background: 'linear-gradient(135deg,#f4d78a,#c99b30)', color: '#241704', border: '1px solid transparent' },
      divider: 'rgba(255,255,255,0.10)',
      apply: { background: 'linear-gradient(135deg,#f4d78a,#cc9f34)', color: '#241704', boxShadow: '0 5px 14px rgba(212,175,55,0.32)' },
      ghost: { background: 'transparent', color: '#F0D488', boxShadow: 'inset 0 0 0 1px rgba(212,175,55,0.45)' },
      ftc: 'rgba(239,231,218,0.5)', flag: true,
    }
  }
  const bg = tier === 'rewards'
    ? `linear-gradient(162deg, color-mix(in srgb, ${brand} 9%, var(--color-background)), var(--color-background) 60%)`
    : `linear-gradient(180deg, color-mix(in srgb, ${brand} 6%, var(--color-background)), var(--color-background) 72%)`
  return {
    tier,
    bg, border: 'var(--color-border-soft)',
    rail: tier === 'rewards' ? `linear-gradient(180deg, ${brand}, ${brand2})` : undefined,
    accentBar: tier === 'everyday' ? `linear-gradient(90deg, ${brand}, ${brand2})` : undefined,
    glow: tier === 'rewards' ? `color-mix(in srgb, ${brand2} 22%, transparent)` : undefined,
    text: 'var(--color-text-primary)', sub: 'var(--color-text-secondary)', issuerColor: 'var(--color-text-secondary)', logoBg: 'var(--color-background)',
    pillBg: `linear-gradient(135deg, ${brand}, ${brand2})`, pillColor: '#ffffff', pillBorder: 'transparent', accent: brand,
    badgeBg: 'var(--color-background-soft)', badgeColor: 'var(--color-text-secondary)', badgeBorder: 'var(--color-border-soft)',
    cmp: { background: 'var(--color-background)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-soft)' },
    cmpOn: { background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)' },
    divider: 'var(--color-border-soft)',
    apply: { background: `linear-gradient(135deg, ${brand}, ${brand2})`, color: '#ffffff', boxShadow: `0 4px 12px color-mix(in srgb, ${brand} 35%, transparent)` },
    ghost: { background: 'transparent', color: brand, boxShadow: `inset 0 0 0 1px ${brand}` },
    ftc: 'var(--color-text-secondary)', flag: false,
  }
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
  const th = tileTheme(cardTier(c.annualFee), c.issuerName)
  const currencyName = c.currency?.name ?? c.coBrand?.name ?? null
  const feeText = c.annualFee === 0 ? '$0' : c.annualFee != null ? `$${c.annualFee}` : 'See card'
  const netLabel = c.network ? ` · ${c.network[0].toUpperCase() + c.network.slice(1)}` : ''
  const freeEveryday = th.tier === 'everyday' && c.annualFee === 0

  const body = (
    <Link href={`/cards/${c.slug}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.5625rem', textDecoration: 'none', color: th.text, position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: th.issuerColor }}>
          {c.issuerLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.issuerLogo} alt="" width={18} height={18} style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 4, objectFit: 'contain', background: th.logoBg, padding: 1 }} />
          )}
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.issuerName}{netLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          {th.flag && <span style={flagSeal}>Premium</span>}
          {compare && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!compareDisabled) compare.toggle(c.id) }}
              disabled={compareDisabled}
              aria-pressed={comparing}
              title={compareDisabled ? 'Comparing 3 cards already' : comparing ? 'Remove from compare' : 'Add to compare'}
              style={comparing ? { ...compareBase, ...th.cmpOn, cursor: 'pointer' } : { ...compareBase, ...th.cmp, opacity: compareDisabled ? 0.4 : 1, cursor: compareDisabled ? 'default' : 'pointer' }}
            >
              {comparing ? '✓ Compare' : '+ Compare'}
            </button>
          )}
        </div>
      </div>
      {/* Reserve 2 lines so the currency pill below lines up across cards. */}
      <div style={{ fontFamily: th.tier === 'premium' ? 'var(--font-display)' : undefined, fontWeight: th.tier === 'premium' ? 700 : 600, fontSize: th.tier === 'premium' ? '1.2rem' : '1.0625rem', lineHeight: 1.25, minHeight: '2.5em', color: th.text }}>{c.name}</div>
      {currencyName && (
        <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '999px', background: th.pillBg, color: th.pillColor, border: `1px solid ${th.pillBorder}` }}>Earns {currencyName}</span>
      )}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <ThemedStat label="Annual fee" value={freeEveryday ? 'No annual fee' : feeText} th={th} color={freeEveryday ? '#2f7d4f' : th.text} />
        {c.sub && <ThemedStat label="Welcome bonus" value={formatBonus(c.sub.bonus_amount, c.sub.bonus_currency)} th={th} color={th.accent} strong />}
        {c.noFxFee && <ThemedStat label="FX fee" value="None" th={th} color={th.text} />}
      </div>
      {c.topEarn.length > 0 && (
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: th.sub }}>
          {c.topEarn.map((e) => `${e.multiplier % 1 === 0 ? e.multiplier : e.multiplier.toFixed(1)}x ${earnLabel(e.category)}`).join(' · ')}
        </div>
      )}
      {has.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3125rem' }}>
          {has.map((b) => <span key={b.key} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', padding: '0.1875rem 0.5rem', borderRadius: '999px', background: th.badgeBg, border: `1px solid ${th.badgeBorder}`, color: th.badgeColor }}>{b.label}</span>)}
        </div>
      )}
      {pool && (
        <div style={{ fontSize: '0.75rem', color: th.sub, fontFamily: 'var(--font-ui)' }}>
          Requires pairing with a premium sibling card to transfer.
        </div>
      )}
    </Link>
  )

  // Apply → our referral link when we have one, otherwise the issuer's own
  // official card page. Only the referral case carries the "we may earn" note.
  const applyUrl = c.affiliateUrl ?? c.officialUrl
  const isReferral = !!c.affiliateUrl
  // Per-card disclosure removed in favor of one blanket disclosure on the page
  // (see the Card Explorer page). The button row stays bottom-pinned so CTAs
  // still line up across cards of different heights.
  const cta = (
    <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '0.875rem', borderTop: `1px solid ${th.divider}`, display: 'flex', gap: '0.5rem' }}>
      {applyUrl ? (
        <>
          <a href={applyUrl} target="_blank" rel={isReferral ? 'noopener nofollow sponsored' : 'noopener nofollow'} style={{ ...ctaBtn, ...th.apply, flex: '1.6 1 0' }}>Apply →</a>
          <Link href={`/cards/${c.slug}`} style={{ ...ctaBtn, ...th.ghost, flex: '1 1 0' }}>Details</Link>
        </>
      ) : (
        <Link href={`/cards/${c.slug}`} style={{ ...ctaBtn, ...th.ghost, flex: '1 1 0' }}>View card details →</Link>
      )}
    </div>
  )

  // Premium wears a gold gradient frame around an obsidian face; the others sit
  // on a brand-tinted card with a rail (rewards) or top accent bar (everyday).
  const inner = (
    <div style={{ position: 'relative', overflow: 'hidden', height: '100%', flex: '1 1 auto', borderRadius: th.frame ? '13px' : 'var(--radius-card)', background: th.bg, border: th.frame ? 'none' : `1px solid ${th.border}`, padding: th.rail ? '1.125rem 1.25rem 1.125rem 1.375rem' : th.accentBar ? '1.25rem 1.25rem 1.125rem' : '1.125rem 1.25rem', boxShadow: th.frame ? undefined : 'var(--shadow-soft)', display: 'flex', flexDirection: 'column' }}>
      {th.rail && <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: th.rail }} />}
      {th.accentBar && <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4, background: th.accentBar }} />}
      {th.glow && <div aria-hidden style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: `radial-gradient(circle, ${th.glow}, transparent 68%)`, pointerEvents: 'none' }} />}
      {body}
      {cta}
    </div>
  )
  if (th.frame) {
    return <div style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '15px', padding: '2px', background: th.frame, boxShadow: '0 14px 30px rgba(0,0,0,0.34)' }}>{inner}</div>
  }
  return inner
}

function ThemedStat({ label, value, th, color, strong }: { label: string; value: string; th: TileTheme; color: string; strong?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: th.sub }}>{label}</div>
      <div style={{ fontWeight: 800, fontFamily: 'var(--font-ui)', color, fontSize: strong ? '0.95rem' : '0.9rem' }}>{value}</div>
    </div>
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
// Tiered tile: Apply/Details CTA button, compare pill, premium "Flagship" seal.
const ctaBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', minHeight: 44, padding: '0 1rem', borderRadius: 'var(--radius-ui)', border: 'none', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', fontWeight: 800, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }
const compareBase: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.625rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0 }
const flagSeal: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: '0.5625rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0d0a0f', background: 'linear-gradient(135deg,#f4d78a,#c99b30)', padding: '0.2rem 0.5rem', borderRadius: '999px' }
