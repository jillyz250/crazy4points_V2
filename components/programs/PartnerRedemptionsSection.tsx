import Link from 'next/link'
import type { PartnerRedemptionWithPrograms } from '@/utils/supabase/queries'

function formatCost(low: number | null, high: number | null, model: string): string {
  if (low === null && high === null) return 'TBD'
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
  if (low !== null && high !== null && low !== high) return `${fmt(low)}–${fmt(high)}`
  const single = low ?? high!
  return model === 'dynamic' ? `~${fmt(single)}` : fmt(single)
}

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
  marginBottom: '1rem',
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '0.75rem',
  alignItems: 'start',
  padding: '0.875rem 1rem',
  background: '#fff',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-ui)',
}

/**
 * Renders both forward + reverse partner-award sections for a program page.
 * Forward: "Where to spend my [program] miles" (rows where program is currency).
 * Reverse: "Programs that book flights on [carrier]" (rows where program is operating).
 */
export default function PartnerRedemptionsSection({
  programName,
  asCurrency,
  asOperatingCarrier,
}: {
  programName: string
  asCurrency: PartnerRedemptionWithPrograms[]
  asOperatingCarrier: PartnerRedemptionWithPrograms[]
}) {
  if (asCurrency.length === 0 && asOperatingCarrier.length === 0) return null

  return (
    <>
      {asCurrency.length > 0 && (
        <section
          id="redemptions-spend"
          style={{ marginBottom: '2.5rem', scrollMarginTop: '2rem' }}
        >
          <h2 style={headingStyle}>Where to spend your {programName} miles</h2>
          <p style={subtextStyle}>
            Partner-airline redemptions bookable with {programName} miles. Sorted
            by lowest cost. Verify availability and pricing on the {programName}{' '}
            search engine before booking.
          </p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {asCurrency.map((r) => (
              <article key={r.id} style={cardStyle}>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-primary)',
                      fontSize: '1.0625rem',
                    }}
                  >
                    {r.cabin} on{' '}
                    {r.operating_carrier ? (
                      <Link href={`/programs/${r.operating_carrier.slug}`}>
                        {r.operating_carrier.name}
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {r.region_or_route}
                  </div>
                  {r.notes && (
                    <p style={{ marginTop: '0.375rem', fontSize: '0.8125rem' }}>{r.notes}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.375rem',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {formatCost(r.cost_miles_low, r.cost_miles_high, r.pricing_model)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {r.pricing_model}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {asOperatingCarrier.length > 0 && (
        <section
          id="redemptions-book"
          style={{ marginBottom: '2.5rem', scrollMarginTop: '2rem' }}
        >
          <h2 style={headingStyle}>Programs that book {programName} flights</h2>
          <p style={subtextStyle}>
            Loyalty currencies you can use to book {programName} award seats.
            Cheapest options first.
          </p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {asOperatingCarrier.map((r) => (
              <article key={r.id} style={cardStyle}>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--color-primary)',
                      fontSize: '1.0625rem',
                    }}
                  >
                    Book with{' '}
                    {r.currency_program ? (
                      <Link href={`/programs/${r.currency_program.slug}`}>
                        {r.currency_program.name}
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {r.cabin} · {r.region_or_route}
                  </div>
                  {r.notes && (
                    <p style={{ marginTop: '0.375rem', fontSize: '0.8125rem' }}>{r.notes}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.375rem',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {formatCost(r.cost_miles_low, r.cost_miles_high, r.pricing_model)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {r.pricing_model}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
