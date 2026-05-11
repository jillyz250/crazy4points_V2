import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getRedemptionsForRoute } from '@/utils/supabase/bestWayToBookQueries'
import type { EnrichedRedemptionRow } from '@/utils/supabase/bestWayToBookQueries'
import type { RedemptionCabin } from '@/utils/supabase/queries'
import { AIRPORTS, findAirport, mapRouteToBucket, distanceMiles, ROUTE_BUCKET_LABELS } from '@/lib/airports'
import BestWayToBookForm from '@/components/hub/BestWayToBookForm'
import BestWayToBookResultRow from '@/components/hub/BestWayToBookResultRow'
import ChartDisclaimer from '@/components/hub/ChartDisclaimer'

export const metadata: Metadata = {
  title: 'Best Way to Book It — The Points Hub — crazy4points',
  description:
    'Punch in any route. We surface every smart way to book it with points — sorted by miles, with cash fees and gotchas inline.',
  alternates: { canonical: 'https://www.crazy4points.com/hub/best-way-to-book' },
}

export const revalidate = 300

const VALID_CABINS: RedemptionCabin[] = ['Economy', 'Premium Economy', 'Business', 'First']

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; cabin?: string }>
}) {
  const sp = await searchParams
  const fromCode = (sp.from ?? '').trim().toUpperCase()
  const toCode = (sp.to ?? '').trim().toUpperCase()
  const cabin: RedemptionCabin = VALID_CABINS.includes(sp.cabin as RedemptionCabin)
    ? (sp.cabin as RedemptionCabin)
    : 'Economy'

  const fromAirport = fromCode ? findAirport(fromCode) : null
  const toAirport = toCode ? findAirport(toCode) : null

  let bucket = null
  let distance = 0
  let rows: EnrichedRedemptionRow[] = []
  let queryError: string | null = null

  if (fromAirport && toAirport) {
    distance = distanceMiles(fromAirport, toAirport)
    bucket = mapRouteToBucket(fromAirport, toAirport)
    if (bucket) {
      try {
        const supabase = createAdminClient()
        rows = await getRedemptionsForRoute(supabase, fromAirport, toAirport, cabin)
      } catch (err) {
        console.error('[hub/best-way-to-book] query failed:', err)
        queryError = 'Something went wrong loading redemptions. Refresh and try again.'
      }
    }
  }

  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '56rem' }}>
        <Link
          href="/hub"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          ← Back to the Hub
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--color-primary)',
            margin: '0 0 0.75rem',
            lineHeight: 1.1,
          }}
        >
          Best Way to Book It
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'var(--color-text-secondary)',
            margin: '0 0 1.5rem',
            lineHeight: 1.55,
            maxWidth: '40rem',
          }}
        >
          Pick a route. We&apos;ll surface the programs we&apos;ve authored
          for that route region, ranked by typical miles cost — with cash
          fees and the catches inline. Coverage expands as we add programs;
          if a program you expect isn&apos;t here yet, it&apos;s on the
          roadmap, not missing on purpose.
        </p>

        <ChartDisclaimer />
        <BestWayToBookForm
          airports={AIRPORTS}
          initialFrom={fromCode}
          initialTo={toCode}
          initialCabin={cabin}
        />

        {fromCode && toCode && !fromAirport && (
          <p style={errorStyle}>
            We don&apos;t have <strong>{fromCode}</strong> in our airport list
            yet. Try a major hub for now (JFK, LAX, ORD, etc.) — more airports
            coming soon.
          </p>
        )}
        {fromCode && toCode && !toAirport && fromAirport && (
          <p style={errorStyle}>
            We don&apos;t have <strong>{toCode}</strong> in our airport list
            yet.
          </p>
        )}
        {fromAirport && toAirport && !bucket && (
          <p style={errorStyle}>
            We don&apos;t cover {fromAirport.region} ↔ {toAirport.region} routes
            yet. Coming as we expand coverage.
          </p>
        )}
        {queryError && <p style={errorStyle}>{queryError}</p>}

        {fromAirport && toAirport && bucket && (
          <>
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.875rem 1rem',
                background: 'var(--color-background-soft)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.0625rem',
                  color: 'var(--color-primary)',
                  lineHeight: 1.3,
                }}
              >
                {fromAirport.city} ({fromAirport.iata}) ↔ {toAirport.city} ({toAirport.iata})
              </div>
              <div
                style={{
                  marginTop: '0.25rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {distance.toLocaleString()} miles · {ROUTE_BUCKET_LABELS[bucket]} · {cabin}
              </div>
            </div>

            {rows.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem',
                  background: 'var(--color-background-soft)',
                  border: '1px dashed var(--color-border-soft)',
                  borderRadius: 'var(--radius-card)',
                  textAlign: 'center',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    color: 'var(--color-primary)',
                    margin: '0 0 0.5rem',
                  }}
                >
                  No redemptions authored yet for this route
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  We&apos;re building coverage one airline at a time. American
                  Airlines is fully covered today; United, Alaska/Atmos, Delta,
                  and international carriers are coming next.
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: '0.75rem',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {rows.length}{' '}
                  {rows.length === 1 ? 'option' : 'options'} · cheapest first
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {rows.map((r, i) => (
                    <BestWayToBookResultRow key={r.id} r={r} rank={i + 1} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {!fromCode && !toCode && (
          <div
            style={{
              marginTop: '2rem',
              padding: '1.25rem',
              background: 'var(--color-background-soft)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.0625rem',
                color: 'var(--color-primary)',
                margin: '0 0 0.5rem',
              }}
            >
              Try one of these to see how it works
            </h2>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              {[
                { from: 'JFK', to: 'HNL', label: 'New York → Hawaii' },
                { from: 'LGA', to: 'CMH', label: 'LaGuardia → Columbus' },
                { from: 'JFK', to: 'LHR', label: 'New York → London' },
                { from: 'LAX', to: 'NRT', label: 'LA → Tokyo' },
                { from: 'JFK', to: 'DOH', label: 'New York → Doha' },
              ].map((ex) => (
                <Link
                  key={`${ex.from}-${ex.to}`}
                  href={`/hub/best-way-to-book?from=${ex.from}&to=${ex.to}&cabin=Economy`}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    padding: '0.375rem 0',
                  }}
                >
                  → {ex.label} ({ex.from} → {ex.to})
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

const errorStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  background: '#FECACA',
  border: '1px solid #F87171',
  borderRadius: 'var(--radius-card)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9375rem',
  color: '#7F1D1D',
  margin: '0 0 1.5rem',
}
