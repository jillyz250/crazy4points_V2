'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { FinderCard } from '@/utils/supabase/queries'

const FAMILY_LABELS: Record<string, string> = {
  lounge: 'Lounge access', insurance: 'Travel insurance', credit: 'Statement credits',
  hotel: 'Hotel benefits', airline: 'Airline benefits', status: 'Elite status',
  protection: 'Purchase protection', earning: 'Earning / transfers', perk: 'Perks',
}
const FAMILY_ORDER = ['lounge', 'insurance', 'credit', 'hotel', 'airline', 'status', 'protection', 'earning', 'perk']
const NETWORKS = [['visa', 'Visa'], ['mastercard', 'Mastercard'], ['amex', 'Amex']] as const
const FEE_OPTIONS = [[null, 'Any'], [0, 'No annual fee'], [100, 'Under $100'], [250, 'Under $250']] as const

export interface ProgramOption { slug: string; name: string }

export default function CardFinder({
  cards,
  programOptions,
  transferSources,
}: {
  cards: FinderCard[]
  programOptions: ProgramOption[]
  /** programSlug -> source-currency slugs that transfer INTO it */
  transferSources: Record<string, string[]>
}) {
  const [target, setTarget] = useState('')
  const [cardType, setCardType] = useState<'all' | 'personal' | 'business'>('all')
  const [maxFee, setMaxFee] = useState<number | null>(null)
  const [networks, setNetworks] = useState<string[]>([])
  const [families, setFamilies] = useState<string[]>([])
  const [issuers, setIssuers] = useState<string[]>([])
  const [noFx, setNoFx] = useState(false)
  const [q, setQ] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const allIssuers = useMemo(
    () => Array.from(new Set(cards.map((c) => c.issuerName).filter(Boolean))).sort(),
    [cards],
  )
  const allFamilies = useMemo(
    () => FAMILY_ORDER.filter((f) => cards.some((c) => c.benefitFamilies.includes(f))),
    [cards],
  )

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  // Apply the universal (non-target) filters first.
  const base = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return cards.filter((c) => {
      if (cardType !== 'all' && c.cardType !== cardType) return false
      if (maxFee !== null && (c.annualFee ?? Infinity) > maxFee) return false
      if (networks.length && (!c.network || !networks.includes(c.network))) return false
      if (noFx && !c.noFxFee) return false
      if (issuers.length && !issuers.includes(c.issuerName)) return false
      if (families.length && !families.every((f) => c.benefitFamilies.includes(f))) return false
      if (ql && !(`${c.name} ${c.issuerName}`.toLowerCase().includes(ql))) return false
      return true
    })
  }, [cards, cardType, maxFee, networks, noFx, issuers, families, q])

  // When a target program is chosen, split into direct earners vs transfer routes.
  const grouped = useMemo(() => {
    if (!target) return null
    const sources = new Set(transferSources[target] ?? [])
    const direct: FinderCard[] = []
    const transfer: FinderCard[] = []
    for (const c of base) {
      if (c.coBrand?.slug === target || c.currency?.slug === target) direct.push(c)
      else if (c.currency && sources.has(c.currency.slug) && c.transferEligibility !== 'none') transfer.push(c)
    }
    const byFee = (a: FinderCard, b: FinderCard) => (a.annualFee ?? Infinity) - (b.annualFee ?? Infinity)
    return { direct: direct.sort(byFee), transfer: transfer.sort(byFee) }
  }, [base, target, transferSources])

  const targetName = programOptions.find((p) => p.slug === target)?.name ?? ''
  const resultCount = grouped ? grouped.direct.length + grouped.transfer.length : base.length

  return (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 1fr)' }}>
      {/* Target selector — the headline question */}
      <div style={panel}>
        <label style={labelStyle} htmlFor="target">I want points in…</label>
        <select id="target" value={target} onChange={(e) => setTarget(e.target.value)} style={inputStyle}>
          <option value="">Any program — show me all cards</option>
          {programOptions.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
      </div>

      <button onClick={() => setShowFilters((s) => !s)} style={filtersToggle} className="rg-tap-target">
        {showFilters ? 'Hide filters' : 'Filters'}{activeCount({ cardType, maxFee, networks, families, issuers, noFx }) ? ` (${activeCount({ cardType, maxFee, networks, families, issuers, noFx })})` : ''}
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

          <Field label="Annual fee">
            <div style={chipRow}>
              {FEE_OPTIONS.map(([v, lbl]) => (
                <Chip key={lbl} on={maxFee === v} onClick={() => setMaxFee(v)}>{lbl}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Benefits (must have all selected)">
            <div style={chipRow}>
              {allFamilies.map((f) => (
                <Chip key={f} on={families.includes(f)} onClick={() => toggle(families, f, setFamilies)}>{FAMILY_LABELS[f] ?? f}</Chip>
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

          <button onClick={() => { setCardType('all'); setMaxFee(null); setNetworks([]); setFamilies([]); setIssuers([]); setNoFx(false); setQ('') }} style={clearBtn}>
            Clear filters
          </button>
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
        {resultCount} {resultCount === 1 ? 'card' : 'cards'}{target ? ` for ${targetName}` : ''}
      </p>

      {grouped ? (
        <>
          <Group
            title={`Earns ${targetName} directly`}
            subtitle="Co-branded cards (and cards that earn this currency outright)."
            cards={grouped.direct}
          />
          <Group
            title={`Transfers to ${targetName}`}
            subtitle="Flexible-points cards whose currency transfers in. Some require pairing with a premium sibling card."
            cards={grouped.transfer}
            showTransferNote
          />
          {resultCount === 0 && <Empty />}
        </>
      ) : (
        <div style={grid}>
          {base.map((c) => <CardTile key={c.id} c={c} />)}
          {base.length === 0 && <Empty />}
        </div>
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
  return (
    <Link href={`/cards/${c.slug}`} style={tile}>
      <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
        {c.issuerName}{c.network ? ` · ${c.network[0].toUpperCase() + c.network.slice(1)}` : ''}
      </div>
      <div style={{ fontWeight: 600, fontSize: '1.0625rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{c.name}</div>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: c.benefitFamilies.length ? '0.625rem' : 0 }}>
        <Stat label="Annual fee" value={c.annualFee === 0 ? '$0' : c.annualFee != null ? `$${c.annualFee}` : '—'} />
        {c.sub && <Stat label="Welcome bonus" value={c.sub.bonus_amount.toLocaleString()} />}
        {c.noFxFee && <Stat label="FX fee" value="None" />}
      </div>
      {c.benefitFamilies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3125rem' }}>
          {c.benefitFamilies.map((f) => (
            <span key={f} style={famBadge}>{FAMILY_LABELS[f] ?? f}</span>
          ))}
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
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
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

function activeCount(s: { cardType: string; maxFee: number | null; networks: string[]; families: string[]; issuers: string[]; noFx: boolean }) {
  return (s.cardType !== 'all' ? 1 : 0) + (s.maxFee !== null ? 1 : 0) + s.networks.length + s.families.length + s.issuers.length + (s.noFx ? 1 : 0)
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
