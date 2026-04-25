import type { TierBenefitRow } from '@/utils/supabase/queries'

/**
 * Renders structured elite tiers from the JSONB field as a stacked table.
 * Mobile-friendly: each tier is its own card-like block on narrow screens
 * via the parent overflow-x:auto and pre-wrap benefits column.
 */
export default function TierBenefitsTable({
  rows,
}: {
  rows: TierBenefitRow[]
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
              Tier
            </th>
            <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              Qualification
            </th>
            <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              Key benefits
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tier, i) => (
            <tr
              key={`${tier.name}-${i}`}
              style={{
                borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--color-border-soft)',
                verticalAlign: 'top',
              }}
            >
              <td style={{ padding: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {tier.name}
              </td>
              <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                {tier.qualification || '—'}
              </td>
              <td style={{ padding: '0.75rem', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                {tier.benefits.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {tier.benefits.map((b, j) => (
                      <li key={j} style={{ marginBottom: j === tier.benefits.length - 1 ? 0 : '0.25rem' }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
