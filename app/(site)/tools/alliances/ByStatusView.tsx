import Link from 'next/link'
import type { Program, MemberProgramRow, TierBenefitRow } from '@/utils/supabase/queries'

export default function ByStatusView({
  alliances,
  airlines,
  loyaltyPrograms,
  selectedSlug,
  selectedTier,
}: {
  alliances: Program[]
  airlines: Program[]
  loyaltyPrograms: Program[]
  selectedSlug: string
  selectedTier: string
}) {
  const allCarriers = [...airlines, ...loyaltyPrograms].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  // Build a lookup: for each program slug, what alliance + crossover row?
  const allianceForSlug = new Map<string, { alliance: Program; member: MemberProgramRow }>()
  for (const a of alliances) {
    if (!a.member_programs) continue
    for (const m of a.member_programs) {
      allianceForSlug.set(m.program_slug, { alliance: a, member: m })
      if (m.carrier_slugs) {
        for (const c of m.carrier_slugs) allianceForSlug.set(c, { alliance: a, member: m })
      }
    }
  }

  const selectedHit = selectedSlug ? allianceForSlug.get(selectedSlug) : null
  const selectedProgram = selectedSlug ? allCarriers.find((p) => p.slug === selectedSlug) : null

  // Tiers available on the selected program
  const selectedTiers = selectedHit?.member.tier_crossover ?? []

  // What alliance tier does the user's selected member tier map to?
  const matchedAllianceTier = selectedTiers.find((t) => t.member_tier === selectedTier)?.alliance_tier

  // What benefits unlock at that alliance tier?
  const allianceBenefits: TierBenefitRow | undefined = selectedHit?.alliance.tier_benefits?.find(
    (tb) => tb.name === matchedAllianceTier
  )

  // Other programs in same alliance with the same alliance tier mapping
  const equivalents: Array<{
    program: Program | undefined
    member: MemberProgramRow
    member_tiers: string[]
  }> =
    selectedHit && matchedAllianceTier
      ? selectedHit.alliance.member_programs!
          .filter((m) => m.program_slug !== selectedHit.member.program_slug)
          .map((m) => ({
            program: allCarriers.find((p) => p.slug === m.program_slug),
            member: m,
            member_tiers: (m.tier_crossover ?? [])
              .filter((t) => t.alliance_tier === matchedAllianceTier)
              .map((t) => t.member_tier),
          }))
          .filter((e) => e.member_tiers.length > 0)
      : []

  return (
    <div>
      <form
        method="get"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'end',
          marginBottom: '1.5rem',
        }}
      >
        <input type="hidden" name="view" value="status" />
        <div style={{ minWidth: '14rem', flex: '1 1 18rem' }}>
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
            I have status with
          </label>
          <select
            name="program"
            defaultValue={selectedSlug}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.9375rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              background: '#fff',
            }}
          >
            <option value="">Select program…</option>
            {allCarriers
              .filter((p) => allianceForSlug.has(p.slug))
              .map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
          </select>
        </div>
        <div style={{ minWidth: '14rem', flex: '1 1 18rem' }}>
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
            My tier
          </label>
          <select
            name="tier"
            defaultValue={selectedTier}
            disabled={selectedTiers.length === 0}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.9375rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              background: '#fff',
            }}
          >
            <option value="">{selectedTiers.length === 0 ? 'Select program first' : 'Select tier…'}</option>
            {selectedTiers.map((t) => (
              <option key={t.member_tier} value={t.member_tier}>
                {t.member_tier} → {t.alliance_tier}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rg-btn-primary" style={{ height: '2.375rem' }}>
          Compare
        </button>
      </form>

      {!selectedHit && (
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Pick a program and tier to see equivalent benefits across the rest of
          the alliance.
        </p>
      )}

      {selectedHit && !matchedAllianceTier && (
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {selectedProgram?.name} is in {selectedHit.alliance.name}. Pick your
          tier to see the alliance equivalent.
        </p>
      )}

      {selectedHit && matchedAllianceTier && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div
            style={{
              padding: '1.5rem',
              background: 'var(--color-background-soft)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border-soft)',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {selectedProgram?.name} {selectedTier} =
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                color: 'var(--color-primary)',
                margin: '0.25rem 0',
              }}
            >
              {selectedHit.alliance.name} {matchedAllianceTier}
            </div>
          </div>

          {allianceBenefits && (
            <section>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                What you get at {selectedHit.alliance.name} {matchedAllianceTier}
              </h3>
              <ul style={{ paddingLeft: '1.25rem' }}>
                {allianceBenefits.benefits.map((b, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{b}</li>
                ))}
              </ul>
            </section>
          )}

          {equivalents.length > 0 && (
            <section>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                Equivalent status on other {selectedHit.alliance.name} carriers
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                These tiers also map to {selectedHit.alliance.name} {matchedAllianceTier} — useful for status match research.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {equivalents.map((e) => (
                  <Link
                    key={e.member.program_slug}
                    href={`/programs/${e.member.program_slug}`}
                    style={{
                      display: 'block',
                      padding: '0.75rem',
                      background: '#fff',
                      borderRadius: 'var(--radius-ui)',
                      border: '1px solid var(--color-border-soft)',
                      textDecoration: 'none',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{e.program?.name ?? e.member.program_slug}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {e.member_tiers.join(', ')}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
