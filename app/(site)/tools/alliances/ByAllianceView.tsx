import Link from 'next/link'
import type { Program } from '@/utils/supabase/queries'

export default function ByAllianceView({
  alliances,
  airlines,
  loyaltyPrograms,
}: {
  alliances: Program[]
  airlines: Program[]
  loyaltyPrograms: Program[]
}) {
  const sorted = [...alliances].sort((a, b) => a.name.localeCompare(b.name))
  const allMembers = [...airlines, ...loyaltyPrograms]
  const memberLookup = new Map(allMembers.map((p) => [p.slug, p]))

  return (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      {sorted.map((alliance) => (
        <article
          key={alliance.id}
          style={{
            background: 'var(--color-background-soft)',
            borderRadius: 'var(--radius-card)',
            padding: '2rem',
            border: '1px solid var(--color-border-soft)',
          }}
        >
          <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-primary)',
                margin: 0,
                fontSize: '1.75rem',
              }}
            >
              {alliance.name}
            </h2>
            <Link
              href={`/programs/${alliance.slug}`}
              className="rg-btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              Full {alliance.name} page →
            </Link>
          </header>

          {alliance.tier_benefits && alliance.tier_benefits.length > 0 && (
            <section style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  marginTop: 0,
                  marginBottom: '0.75rem',
                }}
              >
                Tier ladder
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${alliance.tier_benefits.length}, 1fr)`,
                  gap: '1rem',
                }}
              >
                {alliance.tier_benefits.map((tier) => (
                  <div
                    key={tier.name}
                    style={{
                      background: '#fff',
                      borderRadius: 'var(--radius-ui)',
                      padding: '1rem',
                      border: '1px solid var(--color-border-soft)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--color-primary)',
                        fontSize: '1.125rem',
                        fontWeight: 700,
                      }}
                    >
                      {tier.name}
                    </div>
                    {tier.qualification && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          fontStyle: 'italic',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {tier.qualification}
                      </div>
                    )}
                    <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8125rem' }}>
                      {tier.benefits.map((b, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {alliance.member_programs && alliance.member_programs.length > 0 && (
            <section>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  marginTop: 0,
                  marginBottom: '0.75rem',
                }}
              >
                Member programs ({alliance.member_programs.length})
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(13rem, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {alliance.member_programs.map((member) => {
                  const program = memberLookup.get(member.program_slug)
                  const name = program?.name ?? member.program_slug
                  return (
                    <Link
                      key={member.program_slug}
                      href={`/programs/${member.program_slug}`}
                      style={{
                        display: 'block',
                        background: '#fff',
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-ui)',
                        border: '1px solid var(--color-border-soft)',
                        textDecoration: 'none',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.8125rem',
                        transition: 'border-color 0.15s, transform 0.15s',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{name}</div>
                      {member.tier_crossover && member.tier_crossover.length > 0 && (
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--color-text-secondary)',
                            marginTop: '0.125rem',
                          }}
                        >
                          {member.tier_crossover.length} elite{' '}
                          {member.tier_crossover.length === 1 ? 'tier' : 'tiers'}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </article>
      ))}
    </div>
  )
}
