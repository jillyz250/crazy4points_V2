import type { AwardCategoryRow } from '@/utils/supabase/queries'

/**
 * Renders a hotel program's category award chart: one row per category with
 * off-peak / standard / peak point bands. Wrapped in .rg-table-scroll so the
 * wide table scrolls horizontally on narrow viewports (mobile contract).
 */
export default function HotelAwardChartTable({
  rows,
}: {
  rows: AwardCategoryRow[]
}) {
  if (rows.length === 0) return null

  const hasNotes = rows.some((r) => r.notes?.trim())

  const thStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--color-text-secondary)',
    textAlign: 'left',
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid var(--color-border-soft)',
    whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    padding: '0.625rem 0.75rem',
    borderBottom: '1px solid var(--color-border-soft)',
    verticalAlign: 'top',
  }

  return (
    <div className="rg-table-scroll">
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'var(--color-background)',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Off-peak</th>
            <th style={thStyle}>Standard</th>
            <th style={thStyle}>Peak</th>
            {hasNotes && <th style={thStyle}>Notes</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.category}-${i}`}>
              <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-primary)' }}>
                {row.category}
              </td>
              <td style={tdStyle}>{row.off_peak ?? '—'}</td>
              <td style={tdStyle}>{row.standard ?? '—'}</td>
              <td style={tdStyle}>{row.peak ?? '—'}</td>
              {hasNotes && (
                <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
                  {row.notes?.trim() ? row.notes : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
