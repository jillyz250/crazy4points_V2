import { createAdminClient } from '@/utils/supabase/server'
import { getAllPrograms } from '@/utils/supabase/queries'
import type { ProgramType, Program } from '@/utils/supabase/queries'
import { toggleProgramAction } from './actions'

const TYPE_LABEL: Record<ProgramType, string> = {
  credit_card:    'Credit Card',
  airline:        'Airline',
  hotel:          'Hotel',
  car_rental:     'Car Rental',
  cruise:         'Cruise',
  shopping_portal: 'Shopping Portal',
  travel_portal:  'Travel Portal',
  lounge_network: 'Lounge Network',
  ota:            'OTA',
}

const TYPE_BADGE_COLOR: Record<ProgramType, { bg: string; color: string }> = {
  credit_card:    { bg: '#f0e6fa', color: '#6B2D8F' },
  airline:        { bg: '#e6f0fa', color: '#1a5fa8' },
  hotel:          { bg: '#e6f4ea', color: '#1e7e34' },
  car_rental:     { bg: '#fff8e1', color: '#b45309' },
  cruise:         { bg: '#e6faf8', color: '#0f766e' },
  shopping_portal:{ bg: '#fce7f3', color: '#9d174d' },
  travel_portal:  { bg: '#fef3c7', color: '#92400e' },
  lounge_network: { bg: '#f3f0f7', color: '#7c5cbf' },
  ota:            { bg: '#f0f0f0', color: '#555555' },
}

// Stable order for program type groups
const TYPE_ORDER: ProgramType[] = [
  'credit_card',
  'airline',
  'hotel',
  'car_rental',
  'cruise',
  'shopping_portal',
  'travel_portal',
  'lounge_network',
  'ota',
]

function groupByType(programs: Program[]): Map<ProgramType, Program[]> {
  const map = new Map<ProgramType, Program[]>()
  for (const p of programs) {
    const key = p.type as ProgramType
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return map
}

export default async function AdminProgramsPage() {
  const supabase = createAdminClient()
  const programs = await getAllPrograms(supabase)
  const grouped = groupByType(programs)

  // Collect types present in the data, preserving TYPE_ORDER
  const presentTypes = TYPE_ORDER.filter((t) => grouped.has(t))
  // Any types not in TYPE_ORDER (future-proofing)
  for (const t of grouped.keys()) {
    if (!presentTypes.includes(t)) presentTypes.push(t)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1>Programs</h1>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-ui)' }}>
          {programs.length} total
        </span>
      </div>

      {programs.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>No programs yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {presentTypes.map((type) => {
            const group = grouped.get(type)!
            const badge = TYPE_BADGE_COLOR[type] ?? { bg: '#f0f0f0', color: '#555555' }
            return (
              <div key={type}>
                {/* Section header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid var(--color-border-soft)',
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-ui)',
                    letterSpacing: '0.02em',
                    background: badge.bg,
                    color: badge.color,
                  }}>
                    {TYPE_LABEL[type] ?? type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', fontFamily: 'var(--font-ui)' }}>
                    {group.length}
                  </span>
                </div>

                {/* Table for this group */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border-soft)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Name</th>
                        <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Tier</th>
                        <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Monitor</th>
                        <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>URL</th>
                        <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((program) => (
                        <tr key={program.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                          <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                            {program.name}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                            {program.tier ?? '—'}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                            {program.monitor_tier ?? '—'}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            {program.program_url ? (
                              <a
                                href={program.program_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: '0.8125rem' }}
                              >
                                Link
                              </a>
                            ) : (
                              <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <form action={toggleProgramAction.bind(null, program.id, !program.is_active)}>
                              <button
                                type="submit"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                  fontSize: '0.8125rem',
                                  fontFamily: 'var(--font-body)',
                                  color: program.is_active ? '#1e7e34' : 'var(--color-text-secondary)',
                                  textDecoration: 'underline',
                                }}
                              >
                                {program.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
