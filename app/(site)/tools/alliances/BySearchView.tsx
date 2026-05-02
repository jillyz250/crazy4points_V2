import Link from 'next/link'
import type {
  Program,
  PartnerRedemptionWithPrograms,
  RedemptionCabin,
} from '@/utils/supabase/queries'

const CABINS: RedemptionCabin[] = ['Economy', 'Premium Economy', 'Business', 'First']

function formatCost(low: number | null, high: number | null, model: string): string {
  if (low === null && high === null) return 'TBD'
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
  if (low !== null && high !== null && low !== high) return `${fmt(low)}–${fmt(high)}`
  const single = low ?? high!
  return model === 'dynamic' ? `~${fmt(single)}` : fmt(single)
}

export default function BySearchView({
  redemptions,
  airlines,
  loyaltyPrograms,
  cabin,
  maxCost,
  currency,
}: {
  redemptions: PartnerRedemptionWithPrograms[]
  airlines: Program[]
  loyaltyPrograms: Program[]
  cabin: string
  maxCost: string
  currency: string
}) {
  const allCurrencies = [...airlines, ...loyaltyPrograms].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  const maxCostNum = Number(maxCost)
  const hasMaxCost = Number.isFinite(maxCostNum) && maxCostNum > 0

  const filtered = redemptions.filter((r) => {
    if (!r.is_active) return false
    if (cabin && r.cabin !== cabin) return false
    if (currency && r.currency_program?.slug !== currency) return false
    if (hasMaxCost) {
      const low = r.cost_miles_low ?? r.cost_miles_high
      if (low === null || low > maxCostNum) return false
    }
    return true
  })

  filtered.sort((a, b) => {
    const aLow = a.cost_miles_low ?? a.cost_miles_high ?? Number.MAX_SAFE_INTEGER
    const bLow = b.cost_miles_low ?? b.cost_miles_high ?? Number.MAX_SAFE_INTEGER
    return aLow - bLow
  })

  return (
    <div>
      <form
        method="get"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'end',
          marginBottom: '1.5rem',
        }}
      >
        <input type="hidden" name="view" value="search" />
        <div style={{ minWidth: '10rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            Cabin
          </label>
          <select
            name="cabin"
            defaultValue={cabin}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              background: '#fff',
            }}
          >
            <option value="">Any cabin</option>
            {CABINS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '10rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            Max cost (miles)
          </label>
          <input
            name="max"
            type="number"
            min="0"
            placeholder="100000"
            defaultValue={maxCost}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
            }}
          />
        </div>
        <div style={{ minWidth: '14rem', flex: '1 1 16rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            Currency (miles you spend)
          </label>
          <select
            name="currency"
            defaultValue={currency}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              background: '#fff',
            }}
          >
            <option value="">Any currency</option>
            {allCurrencies.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rg-btn-primary" style={{ height: '2.375rem' }}>
          Search
        </button>
      </form>

      {redemptions.length === 0 ? (
        <div
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'var(--color-background-soft)',
            borderRadius: 'var(--radius-card)',
            border: '1px dashed var(--color-border-soft)',
          }}
        >
          <p style={{ fontSize: '1.125rem', margin: 0, color: 'var(--color-primary)', fontWeight: 600 }}>
            Adding partner redemptions soon
          </p>
          <p style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>
            Cross-search across alliances will light up as we author the data.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          No redemptions match those filters. Try widening the search.
        </div>
      ) : (
        <>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Showing {filtered.length} of {redemptions.length} redemptions
          </p>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filtered.map((r) => (
              <article
                key={r.id}
                style={{
                  padding: '1rem',
                  background: '#fff',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--color-border-soft)',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: '0.75rem',
                  alignItems: 'start',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.125rem' }}>
                    {r.cabin} on{' '}
                    <Link href={`/programs/${r.operating_carrier?.slug ?? ''}`}>
                      {r.operating_carrier?.name ?? 'Unknown'}
                    </Link>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {r.region_or_route} · book with{' '}
                    <Link href={`/programs/${r.currency_program?.slug ?? ''}`}>
                      {r.currency_program?.name ?? '—'}
                    </Link>
                  </div>
                  {r.notes && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>{r.notes}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.5rem',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {formatCost(r.cost_miles_low, r.cost_miles_high, r.pricing_model)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {r.pricing_model} · {r.confidence}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
