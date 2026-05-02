import Link from 'next/link'
import type { TransferPartnerRow } from '@/utils/supabase/queries'

/**
 * Renders the structured transfer_partners JSONB as a clean responsive table.
 * Falls back to slug if the from_slug isn't in the lookup map (e.g. partner
 * exists but program row not seeded).
 */
export default function TransferPartnersTable({
  rows,
  programNameBySlug,
}: {
  rows: TransferPartnerRow[]
  programNameBySlug: Map<string, string>
}) {
  if (rows.length === 0) return null

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
            <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              From
            </th>
            <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              Ratio
            </th>
            <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const name = programNameBySlug.get(row.from_slug) ?? row.from_slug
            return (
              <tr
                key={`${row.from_slug}-${i}`}
                style={{
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--color-border-soft)',
                  background: row.bonus_active ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                }}
              >
                <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                  <Link
                    href={`/programs/${row.from_slug}`}
                    style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
                  >
                    {name}
                  </Link>
                  {row.bonus_active && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-ui)',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        background: 'var(--color-accent)',
                        color: '#fff',
                      }}
                    >
                      BONUS
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.75rem', fontFamily: 'var(--font-ui)', fontWeight: 600, maxWidth: '14rem' }}>
                  {row.ratio}
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
