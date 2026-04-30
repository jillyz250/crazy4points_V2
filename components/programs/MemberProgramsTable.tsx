import Link from 'next/link'
import type { MemberProgramRow } from '@/utils/supabase/queries'

/**
 * Renders an alliance's member_programs JSONB as a table.
 *
 * Columns: Member program | Carriers | Joined | Tier crossover | Notes.
 * Tier crossover is rendered as inline badges grouped by alliance tier.
 */
export default function MemberProgramsTable({
  rows,
  programNameBySlug,
}: {
  rows: MemberProgramRow[]
  programNameBySlug: Map<string, string>
}) {
  if (rows.length === 0) return null

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '0.625rem 0.75rem',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--color-text-secondary)',
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
            <th style={thStyle}>Member program</th>
            <th style={thStyle}>Carriers</th>
            <th style={thStyle}>Joined</th>
            <th style={thStyle}>Tier crossover</th>
            <th style={thStyle}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const name = programNameBySlug.get(row.program_slug) ?? row.program_slug
            const carriers = (row.carrier_slugs ?? []).map((s) => ({
              slug: s,
              name: programNameBySlug.get(s) ?? s,
            }))
            const grouped = new Map<string, string[]>()
            for (const tc of row.tier_crossover ?? []) {
              const list = grouped.get(tc.alliance_tier) ?? []
              list.push(tc.member_tier)
              grouped.set(tc.alliance_tier, list)
            }
            return (
              <tr
                key={`${row.program_slug}-${i}`}
                style={{
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--color-border-soft)',
                  verticalAlign: 'top',
                }}
              >
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                  <Link
                    href={`/programs/${row.program_slug}`}
                    style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
                  >
                    {name}
                  </Link>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  {carriers.length === 0 ? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                  ) : (
                    carriers.map((c, j) => (
                      <span key={c.slug}>
                        <Link
                          href={`/programs/${c.slug}`}
                          style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
                        >
                          {c.name}
                        </Link>
                        {j < carriers.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  )}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                  {row.joined ?? '—'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.8125rem' }}>
                  {grouped.size === 0 ? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {[...grouped.entries()].map(([allianceTier, memberTiers]) => (
                        <div key={allianceTier}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.6875rem',
                              fontFamily: 'var(--font-ui)',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              background: 'var(--color-primary)',
                              color: '#fff',
                              marginRight: '0.5rem',
                            }}
                          >
                            {allianceTier}
                          </span>
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {memberTiers.join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  {row.notes ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
