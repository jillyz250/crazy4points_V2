import Link from 'next/link'
import type { Program, MemberProgramRow } from '@/utils/supabase/queries'

type AirlineWithAlliance = Program & {
  _alliance?: Program
  _crossover?: MemberProgramRow
}

export default function ByAirlineView({
  airlines,
  alliances,
  loyaltyPrograms,
  query,
  alliance: allianceFilter,
}: {
  airlines: Program[]
  alliances: Program[]
  loyaltyPrograms: Program[]
  query: string
  alliance: string
}) {
  // Index alliance membership: which alliance is each airline/loyalty in?
  const allCarriers = [...airlines, ...loyaltyPrograms]
  const allianceForSlug = new Map<string, { alliance: Program; crossover: MemberProgramRow }>()
  for (const a of alliances) {
    if (!a.member_programs) continue
    for (const m of a.member_programs) {
      // The member_programs entry can name a loyalty program (e.g. "atmos")
      // or an airline carrier directly. We index both directly and via
      // carrier_slugs so per-carrier pages also light up.
      allianceForSlug.set(m.program_slug, { alliance: a, crossover: m })
      if (m.carrier_slugs) {
        for (const carrier of m.carrier_slugs) {
          allianceForSlug.set(carrier, { alliance: a, crossover: m })
        }
      }
    }
  }

  const enriched: AirlineWithAlliance[] = allCarriers.map((p) => {
    const hit = allianceForSlug.get(p.slug)
    return {
      ...p,
      _alliance: hit?.alliance,
      _crossover: hit?.crossover,
    }
  })

  const q = query.trim().toLowerCase()
  const filtered = enriched.filter((p) => {
    if (allianceFilter && p._alliance?.slug !== allianceFilter) return false
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p._alliance?.name.toLowerCase().includes(q) ?? false)
    )
  })

  filtered.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <form
        method="get"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          alignItems: 'end',
        }}
      >
        <input type="hidden" name="view" value="airline" />
        <div style={{ flex: '1 1 16rem', minWidth: '12rem' }}>
          <label
            htmlFor="airline-q"
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
            Search airline or alliance
          </label>
          <input
            id="airline-q"
            name="q"
            defaultValue={query}
            placeholder="United, Cathay, oneworld…"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              fontFamily: 'var(--font-body)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
            }}
          />
        </div>
        <div style={{ minWidth: '11rem' }}>
          <label
            htmlFor="airline-alliance"
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
            Filter by alliance
          </label>
          <select
            id="airline-alliance"
            name="alliance"
            defaultValue={allianceFilter}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              fontFamily: 'var(--font-body)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              background: '#fff',
            }}
          >
            <option value="">All alliances</option>
            {alliances.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rg-btn-primary" style={{ height: '2.375rem' }}>
          Filter
        </button>
      </form>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Showing {filtered.length} of {enriched.length} programs
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
          gap: '0.75rem',
        }}
      >
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/programs/${p.slug}`}
            style={{
              display: 'block',
              padding: '1rem',
              background: '#fff',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border-soft)',
              textDecoration: 'none',
              color: 'var(--color-text-primary)',
              transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.125rem',
                  margin: 0,
                  color: 'var(--color-primary)',
                }}
              >
                {p.name}
              </h3>
              {p._alliance && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {p._alliance.name}
                </span>
              )}
            </div>
            {p._crossover?.tier_crossover && p._crossover.tier_crossover.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {(() => {
                  // Group member tiers by alliance tier so the card shows
                  // "Elite Plus = Gold, Platinum, Diamond" instead of just
                  // "Elite Plus / Elite". Strips the program prefix from
                  // member_tier strings like "SkyMiles Diamond Medallion"
                  // -> "Diamond Medallion" so the card stays scannable.
                  const grouped = new Map<string, string[]>()
                  for (const tc of p._crossover.tier_crossover) {
                    const list = grouped.get(tc.alliance_tier) ?? []
                    // Strip leading program-name token if present (e.g.
                    // "SkyMiles Diamond Medallion" -> "Diamond Medallion").
                    const memberTier = tc.member_tier.replace(/^\S+\s+/, '')
                    list.push(memberTier)
                    grouped.set(tc.alliance_tier, list)
                  }
                  return [...grouped.entries()].map(([allianceTier, memberTiers], i) => (
                    <div key={allianceTier} style={{ marginTop: i === 0 ? 0 : '0.125rem' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{allianceTier}</strong>
                      {' = '}
                      {memberTiers.join(', ')}
                    </div>
                  ))
                })()}
              </div>
            )}
            {!p._alliance && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Non-alliance
              </div>
            )}
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.625rem',
                borderTop: '1px solid var(--color-border-soft)',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              View {p.name} details
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          No matches. Try clearing filters.
        </div>
      )}
    </div>
  )
}
