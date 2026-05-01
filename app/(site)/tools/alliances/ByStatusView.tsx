import Link from 'next/link'
import type { Program, MemberProgramRow, TierBenefitRow } from '@/utils/supabase/queries'
import ByStatusFormClient, { type ByStatusFormProgram } from './ByStatusFormClient'

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

  // Lightweight prop for the client form: every aligned program with its
  // tier_crossover. The client component uses this to populate the program
  // and tier dropdowns reactively without a URL round-trip.
  const formPrograms: ByStatusFormProgram[] = allCarriers
    .filter((p) => allianceForSlug.has(p.slug))
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      tier_crossover: allianceForSlug.get(p.slug)?.member.tier_crossover ?? [],
    }))

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
      <ByStatusFormClient
        programs={formPrograms}
        initialProgram={selectedSlug}
        initialTier={selectedTier}
      />

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
                Other {selectedHit.alliance.name} carriers — same alliance tier
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                These tiers on other {selectedHit.alliance.name} airlines also unlock {selectedHit.alliance.name} {matchedAllianceTier} benefits when you fly them.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {equivalents.map((e) => (
                  <Link
                    key={e.member.program_slug}
                    href={`/programs/${e.member.program_slug}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1rem',
                      background: '#fff',
                      borderRadius: 'var(--radius-card)',
                      border: '1px solid var(--color-border-soft)',
                      textDecoration: 'none',
                      color: 'var(--color-text-primary)',
                      transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.15s',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.0625rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        marginBottom: '0.375rem',
                      }}
                    >
                      {e.program?.name ?? e.member.program_slug}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, flex: 1 }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        {selectedHit.alliance.name} {matchedAllianceTier}
                      </strong>{' '}
                      = {e.member_tiers.join(', ')}
                    </div>
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
                      View {e.program?.name ?? e.member.program_slug} details
                      <span aria-hidden="true">→</span>
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
