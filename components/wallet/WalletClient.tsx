'use client'

/**
 * Wallet — client-side state + UI for /wallet.
 *
 * Two halves:
 *   1. Card picker — cascading "issuer → card_type → card" UX. Saves the
 *      selected card slugs to localStorage.
 *   2. Benefits calendar — monthly accordion (current month open by default,
 *      next 11 visible). For each benefit, a checkbox per period; toggling
 *      marks it used and adds a timestamp to localStorage. Quarterly +
 *      annual credits get their own dedicated sections above the months.
 *
 * No server writes. Everything user-specific is in localStorage.
 */

import { useEffect, useMemo, useState } from 'react'
import type { WalletBundle, WalletBenefit, WalletCard } from '@/utils/wallet/queries'
import {
  loadWalletState,
  saveWalletState,
  setSelectedCards,
  setCertExpiration,
  toggleUsage,
  emptyState,
  type WalletState,
} from '@/lib/wallet/storage'
import {
  monthlySlots,
  quarterlySlots,
  annualSlots,
  daysUntil,
  formatValue,
  type PeriodSlot,
} from '@/lib/wallet/periods'

interface Props {
  bundle: WalletBundle
}

export default function WalletClient({ bundle }: Props) {
  const [state, setState] = useState<WalletState>(emptyState())
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount (avoid SSR mismatch)
  useEffect(() => {
    setState(loadWalletState())
    setHydrated(true)
  }, [])

  // Persist on every state change
  useEffect(() => {
    if (hydrated) saveWalletState(state)
  }, [state, hydrated])

  const today = useMemo(() => new Date(), [])
  const months = useMemo(() => monthlySlots(today), [today])
  const quarters = useMemo(() => quarterlySlots(today), [today])
  const years = useMemo(() => annualSlots(today), [today])

  // Cards the user has chosen
  const selectedCards = useMemo(
    () => bundle.cards.filter((c) => state.selectedCards.includes(c.slug)),
    [bundle.cards, state.selectedCards],
  )

  // Benefits for those cards, partitioned by frequency
  const myBenefits = useMemo(() => {
    const selectedIds = new Set(selectedCards.map((c) => c.id))
    return bundle.benefits.filter((b) => selectedIds.has(b.card_id))
  }, [bundle.benefits, selectedCards])

  const benefitsByFreq = useMemo(() => {
    const monthly: WalletBenefit[] = []
    const quarterly: WalletBenefit[] = []
    const annual: WalletBenefit[] = []
    for (const b of myBenefits) {
      if (b.frequency === 'monthly') monthly.push(b)
      else if (b.frequency === 'quarterly') quarterly.push(b)
      else if (b.frequency === 'annual' || b.frequency === 'anniversary') annual.push(b)
    }
    return { monthly, quarterly, annual }
  }, [myBenefits])

  if (!hydrated) {
    // Avoid SSR flash — render a quiet placeholder until localStorage loads
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Loading your wallet…
      </div>
    )
  }

  return (
    <div>
      {/* Hero summary */}
      <WalletSummary
        cardCount={selectedCards.length}
        benefits={myBenefits}
        state={state}
        currentMonth={months[0]}
        currentQuarter={quarters[0]}
        currentYear={years[0]}
      />

      {/* Card picker */}
      <CardPickerSection
        allCards={bundle.cards}
        selectedSlugs={state.selectedCards}
        onChange={(slugs) => setState((s) => setSelectedCards(s, slugs))}
      />

      {selectedCards.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Annual credits — surfaced at top because they only appear once a year */}
          {benefitsByFreq.annual.length > 0 && (
            <BenefitGroup
              title={`Annual credits — ${years[0].label}`}
              subtitle="Use these before December 31."
              benefits={benefitsByFreq.annual}
              slot={years[0]}
              state={state}
              onToggle={(bid) => setState((s) => toggleUsage(s, bid, years[0].key))}
              onCertExpirationChange={(bid, exp) => setState((s) => setCertExpiration(s, bid, exp))}
            />
          )}

          {/* Quarterly credits — current quarter open */}
          {benefitsByFreq.quarterly.length > 0 && (
            <BenefitGroup
              title={`This quarter — ${quarters[0].label}`}
              subtitle={`Resets ${quarters[0].end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              benefits={benefitsByFreq.quarterly}
              slot={quarters[0]}
              state={state}
              onToggle={(bid) => setState((s) => toggleUsage(s, bid, quarters[0].key))}
              onCertExpirationChange={(bid, exp) => setState((s) => setCertExpiration(s, bid, exp))}
            />
          )}

          {/* Monthly benefits — 12-month accordion, current open */}
          {benefitsByFreq.monthly.length > 0 && (
            <MonthlyCalendar
              benefits={benefitsByFreq.monthly}
              slots={months}
              state={state}
              onToggle={(bid, key) => setState((s) => toggleUsage(s, bid, key))}
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
  currentQuarter,
  currentYear,
}: {
  cardCount: number
  benefits: WalletBenefit[]
  state: WalletState
  currentMonth: PeriodSlot
  currentQuarter: PeriodSlot
  currentYear: PeriodSlot
}) {
  const stats = useMemo(() => {
    let monthlyDue = 0
    let monthlyValue = 0
    let monthlyUsed = 0
    let quarterlyDue = 0
    let annualDue = 0
    for (const b of benefits) {
      const usedInPeriod = (key: string) => !!state.usage[b.id]?.[key]
      const dollarValue = b.value_amount ?? 0
      if (b.frequency === 'monthly') {
        if (usedInPeriod(currentMonth.key)) monthlyUsed += dollarValue
        else {
          monthlyDue += 1
          monthlyValue += dollarValue
        }
      } else if (b.frequency === 'quarterly') {
        if (!usedInPeriod(currentQuarter.key)) quarterlyDue += 1
      } else if (b.frequency === 'annual' || b.frequency === 'anniversary') {
        if (!usedInPeriod(currentYear.key)) annualDue += 1
      }
    }
    return { monthlyDue, monthlyValue, monthlyUsed, quarterlyDue, annualDue }
  }, [benefits, state, currentMonth.key, currentQuarter.key, currentYear.key])

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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2rem',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
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
            <Stat label="This month — to use" value={`${stats.monthlyDue}`} sub={stats.monthlyValue > 0 ? `up to $${stats.monthlyValue}` : ''} />
            <Stat label="This quarter" value={`${stats.quarterlyDue}`} />
            <Stat label="This year" value={`${stats.annualDue}`} />
            {stats.monthlyUsed > 0 && (
              <Stat label="Used this month" value={`$${stats.monthlyUsed}`} sub="captured" tone="success" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'success' }) {
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
          color: tone === 'success' ? '#D4AF37' : 'white',
          marginTop: '0.125rem',
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.125rem' }}>{sub}</div>
      )}
    </div>
  )
}

// ---------- Card picker (cascading) ----------

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

  // Build issuer list from cards
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
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter((s) => s !== slug))
    } else {
      onChange([...selectedSlugs, slug])
    }
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

      {/* Selected pills */}
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

      {/* Cascading dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <Dropdown
          label="Issuer"
          value={issuerSlug}
          onChange={(v) => {
            setIssuerSlug(v)
            setCardType('')
          }}
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

      {/* Card list */}
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
                  transition: 'border 0.15s, background 0.15s',
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
      <p style={{ fontSize: '0.875rem' }}>Pick a card above to see your monthly credits.</p>
    </div>
  )
}

// ---------- Benefit group (annual / quarterly) ----------

function BenefitGroup({
  title,
  subtitle,
  benefits,
  slot,
  state,
  onToggle,
  onCertExpirationChange,
}: {
  title: string
  subtitle?: string
  benefits: WalletBenefit[]
  slot: PeriodSlot
  state: WalletState
  onToggle: (benefitId: string) => void
  onCertExpirationChange: (benefitId: string, expiration: string | null) => void
}) {
  return (
    <section
      style={{
        background: 'white',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <header style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.125rem' }}>{title}</h2>
        {subtitle && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{subtitle}</p>}
      </header>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {benefits.map((b) => (
          <BenefitRow
            key={b.id}
            benefit={b}
            checked={!!state.usage[b.id]?.[slot.key]}
            onToggle={() => onToggle(b.id)}
            certExpiration={state.certExpirations[b.id] ?? null}
            onCertExpirationChange={(exp) => onCertExpirationChange(b.id, exp)}
            disabled={false}
          />
        ))}
      </ul>
    </section>
  )
}

// ---------- Monthly 12-month calendar ----------

function MonthlyCalendar({
  benefits,
  slots,
  state,
  onToggle,
}: {
  benefits: WalletBenefit[]
  slots: PeriodSlot[]
  state: WalletState
  onToggle: (benefitId: string, periodKey: string) => void
}) {
  // Current month is auto-open; future months collapsed by default
  const [openKey, setOpenKey] = useState<string>(slots[0].key)

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Monthly credits</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {slots.map((slot) => {
          const isOpen = openKey === slot.key
          const totalDue = benefits.filter((b) => !state.usage[b.id]?.[slot.key]).length
          const totalUsed = benefits.length - totalDue
          return (
            <article
              key={slot.key}
              style={{
                background: 'white',
                border: `1px solid ${isOpen ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
                borderRadius: 'var(--radius-card)',
                boxShadow: isOpen ? 'var(--shadow-soft)' : 'none',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenKey(isOpen ? '' : slot.key)}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '0.85rem 1.25rem',
                  background: isOpen ? 'var(--color-background-soft)' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-primary)' }}>
                    {slot.label}
                  </span>
                  {slot.isCurrent && (
                    <span
                      style={{
                        background: 'var(--color-accent)',
                        color: '#3a2b00',
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        fontWeight: 700,
                      }}
                    >
                      This month
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {totalUsed > 0 && <span style={{ marginRight: '0.75rem' }}>{totalUsed} used</span>}
                  {totalDue > 0
                    ? `${totalDue} to use`
                    : 'all done ✓'}
                  <span style={{ marginLeft: '0.5rem' }}>{isOpen ? '▾' : '▸'}</span>
                </span>
              </button>
              {isOpen && (
                <ul style={{ listStyle: 'none', padding: '0.5rem 1.25rem 1.25rem', margin: 0 }}>
                  {benefits.map((b) => (
                    <BenefitRow
                      key={b.id}
                      benefit={b}
                      checked={!!state.usage[b.id]?.[slot.key]}
                      onToggle={() => onToggle(b.id, slot.key)}
                      certExpiration={null}
                      onCertExpirationChange={() => {}}
                      disabled={false}
                      daysUntilEnd={daysUntil(slot.end)}
                    />
                  ))}
                </ul>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

// ---------- Individual benefit row ----------

function BenefitRow({
  benefit,
  checked,
  onToggle,
  certExpiration,
  onCertExpirationChange,
  disabled,
  daysUntilEnd,
}: {
  benefit: WalletBenefit
  checked: boolean
  onToggle: () => void
  certExpiration: string | null
  onCertExpirationChange: (exp: string | null) => void
  disabled: boolean
  daysUntilEnd?: number
}) {
  const isFreeNight = benefit.category === 'free_night'
  const value = formatValue(benefit.value_amount, benefit.value_unit)
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.65rem 0',
        borderBottom: '1px solid var(--color-border-soft)',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        style={{
          accentColor: 'var(--color-primary)',
          width: '1.15rem',
          height: '1.15rem',
          marginTop: '0.2rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.5rem',
            alignItems: 'baseline',
          }}
        >
          <div
            style={{
              fontWeight: 500,
              fontSize: '0.95rem',
              color: checked ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
              textDecoration: checked ? 'line-through' : 'none',
            }}
          >
            {benefit.name}
          </div>
          {value && (
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.85rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
          {benefit.card_name}
          {daysUntilEnd !== undefined && daysUntilEnd <= 31 && !checked && (
            <span style={{ marginLeft: '0.5rem', color: daysUntilEnd <= 7 ? '#b04545' : 'var(--color-text-secondary)' }}>
              · {daysUntilEnd === 0 ? 'ends today' : `${daysUntilEnd}d left`}
            </span>
          )}
        </div>
        {benefit.description && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.35rem',
              lineHeight: 1.45,
            }}
          >
            {benefit.description}
          </p>
        )}
        {isFreeNight && (
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <label style={{ color: 'var(--color-text-secondary)' }}>Your cert expires:</label>
            <input
              type="date"
              value={certExpiration ?? ''}
              onChange={(e) => onCertExpirationChange(e.target.value || null)}
              style={{
                fontSize: '0.875rem',
                padding: '0.25rem 0.4rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                fontFamily: 'var(--font-body)',
              }}
            />
            {certExpiration && (
              <span style={{ color: 'var(--color-text-secondary)' }}>
                · {daysUntil(new Date(certExpiration))}d
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
