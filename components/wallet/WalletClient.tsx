'use client'

/**
 * Wallet — running-balance credit checklist.
 *
 * Three views on top of the same data:
 *   1. Card picker (cascading dropdowns)
 *   2. Annual credits — clickable card showing pool + spent + remaining
 *   3. Periodic credits (semi-annual / quarterly / monthly) — pill bar of
 *      periods, click to switch, see remaining balance per credit, log uses
 *      with date + note + amount
 *
 * State lives in localStorage. Pool size for a benefit per period comes from
 * the benefit row's `value_amount` × period (e.g. $10/mo on Lyft).
 */

import { useEffect, useMemo, useState } from 'react'
import type { WalletBundle, WalletBenefit, WalletCard } from '@/utils/wallet/queries'
import {
  loadWalletState,
  saveWalletState,
  setSelectedCards,
  logUse,
  deleteUse,
  setCert,
  sumUses,
  emptyState,
  type WalletState,
  type UseRecord,
  type CertRecord,
} from '@/lib/wallet/storage'
import {
  monthlySlots,
  quarterlySlots,
  semiAnnualSlots,
  annualSlots,
  daysUntil,
  formatUSD,
  type PeriodSlot,
} from '@/lib/wallet/periods'

interface Props {
  bundle: WalletBundle
}

export default function WalletClient({ bundle }: Props) {
  const [state, setState] = useState<WalletState>(emptyState())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadWalletState())
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (hydrated) saveWalletState(state)
  }, [state, hydrated])

  const today = useMemo(() => new Date(), [])
  const months = useMemo(() => monthlySlots(today), [today])
  const quarters = useMemo(() => quarterlySlots(today), [today])
  const halves = useMemo(() => semiAnnualSlots(today), [today])
  const years = useMemo(() => annualSlots(today), [today])

  // Selected cards + their benefits
  const selectedCards = useMemo(
    () => bundle.cards.filter((c) => state.selectedCards.includes(c.slug)),
    [bundle.cards, state.selectedCards],
  )
  const myBenefits = useMemo(() => {
    const selectedIds = new Set(selectedCards.map((c) => c.id))
    return bundle.benefits.filter((b) => selectedIds.has(b.card_id))
  }, [bundle.benefits, selectedCards])

  const benefitsByFreq = useMemo(() => {
    const monthly: WalletBenefit[] = []
    const quarterly: WalletBenefit[] = []
    const semi: WalletBenefit[] = []
    const annual: WalletBenefit[] = []
    for (const b of myBenefits) {
      if (b.frequency === 'monthly') monthly.push(b)
      else if (b.frequency === 'quarterly') quarterly.push(b)
      else if (b.frequency === 'semi_annual') semi.push(b)
      else if (b.frequency === 'annual' || b.frequency === 'anniversary') annual.push(b)
    }
    return { monthly, quarterly, semi, annual }
  }, [myBenefits])

  // Which period each section is "looking at"
  const [activeMonthKey, setActiveMonthKey] = useState<string>(months[0].key)
  const [activeQuarterKey, setActiveQuarterKey] = useState<string>(quarters[0].key)
  const [activeHalfKey, setActiveHalfKey] = useState<string>(halves[0].key)

  if (!hydrated) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading your wallet…
      </div>
    )
  }

  return (
    <div>
      <WalletSummary
        cardCount={selectedCards.length}
        benefits={myBenefits}
        state={state}
        currentMonth={months[0]}
        currentHalf={halves[0]}
        currentQuarter={quarters[0]}
        currentYear={years[0]}
      />

      <CardPickerSection
        allCards={bundle.cards}
        selectedSlugs={state.selectedCards}
        onChange={(slugs) => setState((s) => setSelectedCards(s, slugs))}
      />

      {selectedCards.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Annual benefits — surfaced first since they only refresh once a year */}
          {benefitsByFreq.annual.length > 0 && (
            <AnnualBlock
              benefits={benefitsByFreq.annual}
              slot={years[0]}
              state={state}
              onLog={(bid, amt, date, note) =>
                setState((s) => logUse(s, bid, years[0].key, amt, date, note))
              }
              onDelete={(bid, useId) =>
                setState((s) => deleteUse(s, bid, years[0].key, useId))
              }
              onCertChange={(bid, patch) => setState((s) => setCert(s, bid, patch))}
            />
          )}

          {/* Semi-annual (StubHub-style $150 H1 + $150 H2) */}
          {benefitsByFreq.semi.length > 0 && (
            <PeriodicSection
              title="Semi-annual credits"
              periods={halves}
              activeKey={activeHalfKey}
              onActiveKeyChange={setActiveHalfKey}
              benefits={benefitsByFreq.semi}
              state={state}
              onLog={(bid, key, amt, date, note) =>
                setState((s) => logUse(s, bid, key, amt, date, note))
              }
              onDelete={(bid, key, useId) =>
                setState((s) => deleteUse(s, bid, key, useId))
              }
            />
          )}

          {/* Quarterly */}
          {benefitsByFreq.quarterly.length > 0 && (
            <PeriodicSection
              title="Quarterly credits"
              periods={quarters}
              activeKey={activeQuarterKey}
              onActiveKeyChange={setActiveQuarterKey}
              benefits={benefitsByFreq.quarterly}
              state={state}
              onLog={(bid, key, amt, date, note) =>
                setState((s) => logUse(s, bid, key, amt, date, note))
              }
              onDelete={(bid, key, useId) =>
                setState((s) => deleteUse(s, bid, key, useId))
              }
            />
          )}

          {/* Monthly — pill bar of next 12 months */}
          {benefitsByFreq.monthly.length > 0 && (
            <PeriodicSection
              title="Monthly credits"
              periods={months}
              activeKey={activeMonthKey}
              onActiveKeyChange={setActiveMonthKey}
              benefits={benefitsByFreq.monthly}
              state={state}
              onLog={(bid, key, amt, date, note) =>
                setState((s) => logUse(s, bid, key, amt, date, note))
              }
              onDelete={(bid, key, useId) =>
                setState((s) => deleteUse(s, bid, key, useId))
              }
            />
          )}
        </>
      )}
    </div>
  )
}

// ---------- Hero summary ----------

function WalletSummary({
  cardCount,
  benefits,
  state,
  currentMonth,
  currentHalf,
  currentQuarter,
  currentYear,
}: {
  cardCount: number
  benefits: WalletBenefit[]
  state: WalletState
  currentMonth: PeriodSlot
  currentHalf: PeriodSlot
  currentQuarter: PeriodSlot
  currentYear: PeriodSlot
}) {
  const stats = useMemo(() => {
    let monthlyPool = 0
    let monthlySpent = 0
    let annualPool = 0
    let annualSpent = 0
    let quarterlyPool = 0
    let quarterlySpent = 0
    let semiPool = 0
    let semiSpent = 0
    for (const b of benefits) {
      const pool = b.value_amount ?? 0
      const spent = (key: string) => sumUses(state.uses[b.id]?.[key])
      if (b.frequency === 'monthly') {
        monthlyPool += pool
        monthlySpent += spent(currentMonth.key)
      } else if (b.frequency === 'quarterly') {
        quarterlyPool += pool
        quarterlySpent += spent(currentQuarter.key)
      } else if (b.frequency === 'semi_annual') {
        semiPool += pool
        semiSpent += spent(currentHalf.key)
      } else if (b.frequency === 'annual' || b.frequency === 'anniversary') {
        annualPool += pool
        annualSpent += spent(currentYear.key)
      }
    }
    return {
      monthlyPool,
      monthlySpent,
      monthlyLeft: Math.max(0, monthlyPool - monthlySpent),
      quarterlyLeft: Math.max(0, quarterlyPool - quarterlySpent),
      semiLeft: Math.max(0, semiPool - semiSpent),
      annualLeft: Math.max(0, annualPool - annualSpent),
    }
  }, [benefits, state, currentMonth.key, currentHalf.key, currentQuarter.key, currentYear.key])

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #6B2D8F 0%, #8B4DAF 100%)',
        color: 'white',
        borderRadius: 'var(--radius-card)',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 24px rgba(107, 45, 143, 0.25)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85 }}>
            Your wallet
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, marginTop: '0.25rem' }}>
            {cardCount === 0 ? 'Pick cards below to start' : `${cardCount} card${cardCount === 1 ? '' : 's'}`}
          </div>
        </div>
        {cardCount > 0 && (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {stats.monthlyPool > 0 && (
              <Stat label="This month left" value={formatUSD(stats.monthlyLeft)} sub={`of ${formatUSD(stats.monthlyPool)} pool`} />
            )}
            {stats.semiLeft > 0 && (
              <Stat label="This half left" value={formatUSD(stats.semiLeft)} />
            )}
            {stats.quarterlyLeft > 0 && (
              <Stat label="This quarter left" value={formatUSD(stats.quarterlyLeft)} />
            )}
            {stats.annualLeft > 0 && (
              <Stat label="This year left" value={formatUSD(stats.annualLeft)} tone="accent" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'accent' }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 600,
          color: tone === 'accent' ? '#D4AF37' : 'white',
          marginTop: '0.125rem',
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.125rem' }}>{sub}</div>
      )}
    </div>
  )
}

// ---------- Card picker ----------

function CardPickerSection({
  allCards,
  selectedSlugs,
  onChange,
}: {
  allCards: WalletCard[]
  selectedSlugs: string[]
  onChange: (slugs: string[]) => void
}) {
  const [issuerSlug, setIssuerSlug] = useState<string>('')
  const [cardType, setCardType] = useState<string>('')

  const issuers = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of allCards) map.set(c.issuer_slug, c.issuer_name)
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [allCards])

  const cardTypesForIssuer = useMemo(() => {
    if (!issuerSlug) return []
    const set = new Set<string>()
    for (const c of allCards) if (c.issuer_slug === issuerSlug) set.add(c.card_type)
    return Array.from(set).sort()
  }, [issuerSlug, allCards])

  const filteredCards = useMemo(() => {
    return allCards.filter((c) => {
      if (issuerSlug && c.issuer_slug !== issuerSlug) return false
      if (cardType && c.card_type !== cardType) return false
      return true
    })
  }, [allCards, issuerSlug, cardType])

  const selectedCards = allCards.filter((c) => selectedSlugs.includes(c.slug))

  function toggleCard(slug: string) {
    if (selectedSlugs.includes(slug)) onChange(selectedSlugs.filter((s) => s !== slug))
    else onChange([...selectedSlugs, slug])
  }

  return (
    <section
      style={{
        background: 'white',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>My cards</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
        Pick the cards you carry. Your wallet stays on this device — nothing is synced or shared.
      </p>

      {selectedCards.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {selectedCards.map((c) => (
            <button
              key={c.slug}
              onClick={() => toggleCard(c.slug)}
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.875rem',
                border: 'none',
                borderRadius: '999px',
                padding: '0.4rem 0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              title="Click to remove"
            >
              {c.name}
              <span aria-hidden="true" style={{ opacity: 0.85, fontSize: '0.875rem' }}>×</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <Dropdown
          label="Issuer"
          value={issuerSlug}
          onChange={(v) => { setIssuerSlug(v); setCardType('') }}
          options={[{ value: '', label: 'All issuers' }, ...issuers.map(([slug, name]) => ({ value: slug, label: name }))]}
        />
        <Dropdown
          label="Card type"
          value={cardType}
          onChange={setCardType}
          options={[
            { value: '', label: 'All types' },
            ...cardTypesForIssuer.map((t) => ({ value: t, label: t === 'personal' ? 'Personal' : 'Business' })),
          ]}
          disabled={!issuerSlug}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))',
          gap: '0.5rem',
          maxHeight: '20rem',
          overflowY: 'auto',
          paddingRight: '0.25rem',
        }}
      >
        {filteredCards.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', gridColumn: '1 / -1' }}>
            No cards match that filter.
          </p>
        ) : (
          filteredCards.map((c) => {
            const checked = selectedSlugs.includes(c.slug)
            return (
              <label
                key={c.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.65rem',
                  border: `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
                  borderRadius: 'var(--radius-ui)',
                  background: checked ? 'var(--color-background-soft)' : 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCard(c.slug)}
                  style={{ accentColor: 'var(--color-primary)', width: '1rem', height: '1rem' }}
                />
                <span style={{ flex: 1, lineHeight: 1.3 }}>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {c.issuer_name} · {c.card_type}
                  </span>
                </span>
              </label>
            )
          })
        )}
      </div>
    </section>
  )
}

function Dropdown({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          fontSize: '1rem',
          fontFamily: 'var(--font-body)',
          textTransform: 'none',
          letterSpacing: 'normal',
          color: 'var(--color-text-primary)',
          padding: '0.5rem 0.65rem',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-ui)',
          background: disabled ? '#f5f5f5' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

// ---------- Empty state ----------

function EmptyState() {
  return (
    <div
      style={{
        background: 'var(--color-background-soft)',
        border: '1px dashed var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👛</div>
      <p style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Your wallet is empty</p>
      <p style={{ fontSize: '0.875rem' }}>Pick a card above to see your credits.</p>
    </div>
  )
}

// ---------- Annual block (clickable expandable, shows pool + spent + left) ----------

function AnnualBlock({
  benefits,
  slot,
  state,
  onLog,
  onDelete,
  onCertChange,
}: {
  benefits: WalletBenefit[]
  slot: PeriodSlot
  state: WalletState
  onLog: (bid: string, amt: number, date: string, note?: string) => void
  onDelete: (bid: string, useId: string) => void
  onCertChange: (bid: string, patch: Partial<CertRecord>) => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Annual credits — {slot.label}</h2>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {benefits.map((b) => {
          const pool = b.value_amount ?? 0
          const uses = state.uses[b.id]?.[slot.key] ?? []
          const spent = sumUses(uses)
          const left = Math.max(0, pool - spent)
          const isOpen = !!expanded[b.id]
          const isFreeNight = b.category === 'free_night'
          const isPool = pool > 0
          return (
            <article
              key={b.id}
              style={{
                background: 'white',
                border: `1px solid ${left === 0 && pool > 0 ? 'var(--color-border-soft)' : 'var(--color-primary)'}`,
                borderRadius: 'var(--radius-card)',
                padding: '1rem 1.25rem',
                boxShadow: isOpen ? 'var(--shadow-soft)' : 'none',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                // Don't toggle if click came from a form control inside
                const target = e.target as HTMLElement
                if (target.closest('input, button, select, textarea, label')) return
                setExpanded((s) => ({ ...s, [b.id]: !s[b.id] }))
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{b.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{b.card_name}</div>
                </div>
                {isPool ? (
                  <PoolBadge pool={pool} spent={spent} left={left} />
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{isOpen ? '▾' : '▸'}</span>
                )}
              </header>

              {isOpen && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-soft)' }}>
                  {b.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>{b.description}</p>
                  )}

                  {isFreeNight && (
                    <CertControls
                      cert={state.certs[b.id]}
                      onChange={(patch) => onCertChange(b.id, patch)}
                    />
                  )}

                  {isPool && (
                    <>
                      <UsesList uses={uses} onDelete={(uid) => onDelete(b.id, uid)} />
                      <LogUseForm
                        pool={pool}
                        left={left}
                        onSubmit={(amt, date, note) => onLog(b.id, amt, date, note)}
                      />
                    </>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function PoolBadge({ pool, spent, left }: { pool: number; spent: number; left: number }) {
  const pct = pool > 0 ? Math.max(0, Math.min(1, left / pool)) : 0
  const color = left === 0 ? 'var(--color-text-secondary)' : pct < 0.25 ? '#b04545' : 'var(--color-primary)'
  return (
    <div style={{ textAlign: 'right', minWidth: '8rem' }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 700, color }}>
        {formatUSD(left)} left
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
        {formatUSD(spent)} of {formatUSD(pool)} used
      </div>
      <div style={{ height: '4px', background: 'var(--color-border-soft)', borderRadius: '999px', marginTop: '0.4rem', overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color, transition: 'width 0.2s' }} />
      </div>
    </div>
  )
}

// ---------- Periodic section (monthly / quarterly / semi-annual) ----------

function PeriodicSection({
  title,
  periods,
  activeKey,
  onActiveKeyChange,
  benefits,
  state,
  onLog,
  onDelete,
}: {
  title: string
  periods: PeriodSlot[]
  activeKey: string
  onActiveKeyChange: (k: string) => void
  benefits: WalletBenefit[]
  state: WalletState
  onLog: (bid: string, key: string, amt: number, date: string, note?: string) => void
  onDelete: (bid: string, key: string, useId: string) => void
}) {
  const active = periods.find((p) => p.key === activeKey) ?? periods[0]

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{title}</h2>

      {/* Period pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          paddingBottom: '0.25rem',
        }}
      >
        {periods.map((p) => {
          const isActive = p.key === activeKey
          return (
            <button
              key={p.key}
              onClick={() => onActiveKeyChange(p.key)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
                background: isActive ? 'var(--color-primary)' : 'white',
                color: isActive ? 'white' : 'var(--color-text-primary)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              {p.shortLabel}
              {p.isCurrent && (
                <span
                  style={{
                    marginLeft: '0.4rem',
                    background: 'var(--color-accent)',
                    color: '#3a2b00',
                    fontSize: '0.6rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}
                >
                  Now
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Benefit rows for the active period */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {benefits.map((b) => {
          const pool = b.value_amount ?? 0
          const uses = state.uses[b.id]?.[active.key] ?? []
          const spent = sumUses(uses)
          const left = Math.max(0, pool - spent)
          return (
            <PeriodicBenefitCard
              key={b.id}
              benefit={b}
              pool={pool}
              uses={uses}
              spent={spent}
              left={left}
              periodLabel={active.label}
              daysLeft={daysUntil(active.end)}
              onLog={(amt, date, note) => onLog(b.id, active.key, amt, date, note)}
              onDelete={(useId) => onDelete(b.id, active.key, useId)}
            />
          )
        })}
      </div>
    </section>
  )
}

function PeriodicBenefitCard({
  benefit,
  pool,
  uses,
  spent,
  left,
  periodLabel,
  daysLeft,
  onLog,
  onDelete,
}: {
  benefit: WalletBenefit
  pool: number
  uses: UseRecord[]
  spent: number
  left: number
  periodLabel: string
  daysLeft: number
  onLog: (amt: number, date: string, note?: string) => void
  onDelete: (useId: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <article
      style={{
        background: 'white',
        border: `1px solid ${left === 0 && pool > 0 ? 'var(--color-border-soft)' : 'var(--color-primary)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.25rem',
        boxShadow: open ? 'var(--shadow-soft)' : 'none',
        cursor: 'pointer',
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('input, button, select, textarea, label')) return
        setOpen((o) => !o)
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{benefit.name}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {benefit.card_name}
            {daysLeft <= 14 && left > 0 && (
              <span style={{ marginLeft: '0.5rem', color: daysLeft <= 7 ? '#b04545' : 'var(--color-text-secondary)' }}>
                · {daysLeft}d left in {periodLabel}
              </span>
            )}
          </div>
        </div>
        {pool > 0 ? (
          <PoolBadge pool={pool} spent={spent} left={left} />
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{open ? '▾' : '▸'}</span>
        )}
      </header>

      {open && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border-soft)' }}>
          {benefit.description && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>{benefit.description}</p>
          )}
          {pool > 0 && (
            <>
              <UsesList uses={uses} onDelete={onDelete} />
              <LogUseForm pool={pool} left={left} onSubmit={onLog} />
            </>
          )}
        </div>
      )}
    </article>
  )
}

// ---------- Uses list (entries the user has logged this period) ----------

function UsesList({ uses, onDelete }: { uses: UseRecord[]; onDelete: (id: string) => void }) {
  if (uses.length === 0) {
    return (
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem 0', fontStyle: 'italic' }}>
        Nothing logged yet.
      </p>
    )
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.75rem 0' }}>
      {uses.map((u) => (
        <li
          key={u.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.45rem 0',
            borderBottom: '1px solid var(--color-border-soft)',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>
              <strong>{formatUSD(u.amount)}</strong>
              <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                {new Date(`${u.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            {u.note && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                {u.note}
              </div>
            )}
          </div>
          <button
            onClick={() => onDelete(u.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-ui)',
              textDecoration: 'underline',
            }}
            title="Delete this entry"
          >
            remove
          </button>
        </li>
      ))}
    </ul>
  )
}

// ---------- Log-use form ----------

function LogUseForm({
  pool,
  left,
  onSubmit,
}: {
  pool: number
  left: number
  onSubmit: (amt: number, date: string, note?: string) => void
}) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [amount, setAmount] = useState<string>('')
  const [date, setDate] = useState<string>(todayStr)
  const [note, setNote] = useState<string>('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(amount)
    if (!Number.isFinite(num) || num <= 0) return
    onSubmit(num, date, note || undefined)
    setAmount('')
    setNote('')
    setDate(todayStr)
  }

  if (left === 0 && pool > 0) {
    return (
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 0 }}>
        Pool used up for this period. Resets next period.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(6rem, 1fr) minmax(8rem, 1fr) minmax(10rem, 2fr) auto',
        gap: '0.5rem',
        alignItems: 'end',
      }}
    >
      <FormField label="Amount $">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          max={pool > 0 ? left : undefined}
          placeholder={left > 0 ? `up to ${formatUSD(left)}` : ''}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={inputStyle}
        />
      </FormField>
      <FormField label="Date">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
      </FormField>
      <FormField label="Note (what / where)">
        <input
          type="text"
          placeholder="Optional"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={inputStyle}
        />
      </FormField>
      <button
        type="submit"
        disabled={!amount || Number(amount) <= 0}
        style={{
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-ui)',
          padding: '0.55rem 1rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: amount && Number(amount) > 0 ? 'pointer' : 'not-allowed',
          opacity: amount && Number(amount) > 0 ? 1 : 0.5,
          whiteSpace: 'nowrap',
        }}
      >
        Log
      </button>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  fontSize: '1rem',
  padding: '0.5rem 0.65rem',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-ui)',
  fontFamily: 'var(--font-body)',
  width: '100%',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
      {children}
    </label>
  )
}

// ---------- Cert controls (free night certs) ----------

function CertControls({
  cert,
  onChange,
}: {
  cert: CertRecord | undefined
  onChange: (patch: Partial<CertRecord>) => void
}) {
  const expiresAt = cert?.expiresAt
  const daysLeft = expiresAt ? daysUntil(new Date(`${expiresAt}T00:00:00`)) : null

  return (
    <div
      style={{
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-ui)',
        padding: '0.85rem 1rem',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
        Your certificate
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '0.5rem' }}>
        <FormField label="Issued on">
          <input
            type="date"
            value={cert?.issuedAt ?? ''}
            onChange={(e) => onChange({ issuedAt: e.target.value || undefined })}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Expires on">
          <input
            type="date"
            value={cert?.expiresAt ?? ''}
            onChange={(e) => onChange({ expiresAt: e.target.value || undefined })}
            style={inputStyle}
          />
        </FormField>
        <FormField label="Note (where you'll use it)">
          <input
            type="text"
            value={cert?.note ?? ''}
            placeholder="Optional"
            onChange={(e) => onChange({ note: e.target.value || undefined })}
            style={inputStyle}
          />
        </FormField>
      </div>
      {daysLeft !== null && (
        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8125rem',
            color: daysLeft <= 30 ? '#b04545' : 'var(--color-text-secondary)',
            fontWeight: daysLeft <= 30 ? 600 : 400,
          }}
        >
          {daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
        </div>
      )}
    </div>
  )
}
