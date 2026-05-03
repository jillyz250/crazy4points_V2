import Link from 'next/link'
import type { PartnerRedemptionWithPrograms, Program } from '@/utils/supabase/queries'

function formatCost(low: number | null, high: number | null, model: string): string {
  if (low === null && high === null) return 'No published rate'
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
  if (low !== null && high !== null && low !== high) return `${fmt(low)}–${fmt(high)}`
  const single = low ?? high!
  return model === 'dynamic' ? `~${fmt(single)}` : fmt(single)
}

const CABIN_ORDER: Record<string, number> = {
  Economy: 0,
  'Premium Economy': 1,
  Business: 2,
  First: 3,
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

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  padding: '0.125rem 0.5rem',
  borderRadius: '999px',
  border: '1px solid var(--color-border-soft)',
  color: 'var(--color-text-secondary)',
  background: '#fff',
  whiteSpace: 'nowrap',
}

const PARTNER_ACCESS_STYLES: Record<
  NonNullable<Program['partner_access']>,
  { label: string; bg: string; fg: string }
> = {
  YES_STRONG: { label: 'Strong partner access', bg: '#E6F4EA', fg: '#1B5E20' },
  YES_LIMITED: { label: 'Limited partner access', bg: '#FFF3E0', fg: '#7A4F01' },
  YES_RESTRICTED: { label: 'Restricted partner access', bg: '#FFF3E0', fg: '#7A4F01' },
  HYBRID: { label: 'Hybrid partner access', bg: '#FFF3E0', fg: '#7A4F01' },
  NO: { label: 'No partner award booking', bg: '#F0F0F0', fg: '#4A4A4A' },
}

function chip(label: string, tone: 'neutral' | 'warn' | 'info' = 'neutral'): React.ReactNode {
  const tones: Record<typeof tone, React.CSSProperties> = {
    neutral: {},
    warn: { background: '#FFF3E0', color: '#7A4F01', borderColor: '#F2C97A' },
    info: { background: '#F8F5FB', color: 'var(--color-primary)', borderColor: 'var(--color-border-soft)' },
  }
  return <span style={{ ...chipStyle, ...tones[tone] }}>{label}</span>
}

function CardRow({ r, side }: { r: PartnerRedemptionWithPrograms; side: 'asCurrency' | 'asOperating' }) {
  const phoneOnly = r.bookable_online === false
  const highSurcharges = r.fuel_surcharges === 'high'
  const lowConfidence = r.confidence === 'LOW'
  const noPublishedRate = r.cost_miles_low === null && r.cost_miles_high === null

  const counterparty =
    side === 'asCurrency' ? r.operating_carrier : r.currency_program
  const counterpartyVerb = side === 'asCurrency' ? 'on' : 'with'

  return (
    <article style={cardStyle}>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-primary)',
            fontSize: '1.0625rem',
          }}
        >
          {r.cabin} {counterpartyVerb}{' '}
          {counterparty ? (
            <Link href={`/programs/${counterparty.slug}`}>{counterparty.name}</Link>
          ) : (
            'Unknown'
          )}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {r.region_or_route}
        </div>

        {r.teach_caption && (
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '0.8125rem',
              fontStyle: 'italic',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.45,
            }}
          >
            {r.teach_caption}
          </p>
        )}

        {(r.routing_rules || r.notes) && (
          <p style={{ marginTop: '0.375rem', fontSize: '0.8125rem' }}>
            {r.routing_rules || r.notes}
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
          {phoneOnly && chip('Phone only', 'warn')}
          {highSurcharges && chip('High surcharges', 'warn')}
          {r.fuel_surcharges === 'low' && chip('Low surcharges', 'neutral')}
          {r.requires_saver_space === false && chip('No saver needed', 'info')}
          {lowConfidence && chip('Low confidence', 'warn')}
          {noPublishedRate && chip('Verify before transferring', 'warn')}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: noPublishedRate ? '0.875rem' : '1.375rem',
            color: noPublishedRate ? 'var(--color-text-secondary)' : 'var(--color-primary)',
            lineHeight: 1.1,
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
            marginTop: '0.125rem',
          }}
        >
          {r.pricing_model}
        </div>
      </div>
    </article>
  )
}

function buildSaverSearchUrl(template: string): string {
  // Strip placeholder tokens — most operators ignore unknown query params and
  // route the user to a sensible default search page when {origin} etc. aren't
  // substituted. v2 will inject real values from the tool's input form.
  return template.replace(/\{origin\}|\{destination\}|\{date\}/g, '')
}

function OperatorAccessHeader({ program }: { program: Pick<Program, 'name' | 'partner_access' | 'partner_access_notes' | 'saver_search_url_template'> }) {
  if (!program.partner_access) return null
  const styles = PARTNER_ACCESS_STYLES[program.partner_access]
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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: program.partner_access_notes ? '0.5rem' : 0,
        }}
      >
        <span
          style={{
            ...chipStyle,
            background: styles.bg,
            color: styles.fg,
            borderColor: 'transparent',
          }}
        >
          {styles.label}
        </span>
        {saverUrl && (
          <a
            href={saverUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...chipStyle,
              background: 'var(--color-primary)',
              color: '#fff',
              borderColor: 'var(--color-primary)',
              textTransform: 'none',
              letterSpacing: 0,
              fontSize: '0.75rem',
              padding: '0.25rem 0.625rem',
            }}
          >
            Check {program.name} for saver space →
          </a>
        )}
      </div>
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
          marginTop: '0.5rem',
          marginBottom: 0,
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.45,
        }}
      >
        Partners can only book seats released as <strong>saver award space</strong> by the
        operating airline. Confirm saver inventory on{' '}
        {program.name.split(' ')[0]} before transferring miles.
      </p>
    </div>
  )
}

function groupByCounterparty(
  rows: PartnerRedemptionWithPrograms[],
  side: 'asCurrency' | 'asOperating',
): Array<{ slug: string; name: string; rows: PartnerRedemptionWithPrograms[]; minCost: number }> {
  const groups = new Map<string, { slug: string; name: string; rows: PartnerRedemptionWithPrograms[]; minCost: number }>()
  for (const r of rows) {
    const cp = side === 'asCurrency' ? r.operating_carrier : r.currency_program
    const key = cp?.slug ?? '__unknown__'
    const existing = groups.get(key)
    const cost = r.cost_miles_low ?? r.cost_miles_high ?? Number.MAX_SAFE_INTEGER
    if (existing) {
      existing.rows.push(r)
      if (cost < existing.minCost) existing.minCost = cost
    } else {
      groups.set(key, {
        slug: cp?.slug ?? '',
        name: cp?.name ?? 'Unknown',
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

/**
 * Renders both forward + reverse partner-award sections for a program page.
 * Forward: "Where to spend my [program] miles" (rows where program is currency).
 * Reverse: "Ways to book [carrier] flights" — operator-page Ways To Book view,
 * with partner_access header strip + teach_caption + per-row metadata chips.
 */
export default function PartnerRedemptionsSection({
  programName,
  program,
  asCurrency,
  asOperatingCarrier,
}: {
  programName: string
  /** Full program row — needed for partner_access header on the reverse section. */
  program?: Pick<Program, 'name' | 'partner_access' | 'partner_access_notes' | 'saver_search_url_template'>
  asCurrency: PartnerRedemptionWithPrograms[]
  asOperatingCarrier: PartnerRedemptionWithPrograms[]
}) {
  if (asCurrency.length === 0 && asOperatingCarrier.length === 0) return null

  const operatingGroups = groupByCounterparty(asOperatingCarrier, 'asOperating')
  const currencyGroups = groupByCounterparty(asCurrency, 'asCurrency')

  return (
    <>
      {asCurrency.length > 0 && (
        <section
          id="redemptions-spend"
          style={{ marginBottom: '2.5rem', scrollMarginTop: '2rem' }}
        >
          <h2 style={headingStyle}>Where to spend your {programName} miles</h2>
          <p style={subtextStyle}>
            Partner airlines you can book with {programName} miles. Grouped by airline,
            cheapest cabin first within each. Verify availability and pricing on the{' '}
            {programName} search engine before booking.
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {currencyGroups.map((g) => (
              <div key={g.slug || g.name}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.125rem',
                    color: 'var(--color-primary)',
                    margin: '0 0 0.5rem',
                  }}
                >
                  {g.slug ? <Link href={`/programs/${g.slug}`}>{g.name}</Link> : g.name}
                </h3>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {g.rows.map((r) => (
                    <CardRow key={r.id} r={r} side="asCurrency" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {asOperatingCarrier.length > 0 && (
        <section
          id="redemptions-book"
          style={{ marginBottom: '2.5rem', scrollMarginTop: '2rem' }}
        >
          <h2 style={headingStyle}>Ways to book {programName} flights</h2>
          <p style={subtextStyle}>
            {`Loyalty currencies that price ${programName} award seats — grouped by program, cheapest first. The cheapest chart isn't always the best program: different partners see different award space.`}
          </p>

          {program && <OperatorAccessHeader program={program} />}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {operatingGroups.map((g) => {
              const groupConfidence = g.rows.reduce<'HIGH' | 'MED' | 'LOW'>(
                (acc, r) =>
                  acc === 'LOW' || r.confidence === 'LOW'
                    ? 'LOW'
                    : acc === 'MED' || r.confidence === 'MED'
                      ? 'MED'
                      : 'HIGH',
                'HIGH',
              )
              return (
                <div key={g.slug || g.name}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      margin: '0 0 0.5rem',
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
                      {g.slug ? (
                        <Link href={`/programs/${g.slug}`}>{g.name}</Link>
                      ) : (
                        g.name
                      )}
                    </h3>
                    {groupConfidence !== 'HIGH' &&
                      chip(
                        groupConfidence === 'LOW' ? 'Low confidence data' : 'Medium confidence',
                        'warn',
                      )}
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {g.rows.map((r) => (
                      <CardRow key={r.id} r={r} side="asOperating" />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
