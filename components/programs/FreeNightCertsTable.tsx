import type { FreeNightCertRow } from '@/utils/supabase/queries'

/**
 * Renders Free Night Certificate rules as a responsive card grid — one card
 * per co-brand card that issues a cert. Each card lists the category ceiling,
 * blackout policy, expiry, and any notes. auto-fit/minmax keeps it 1-per-row
 * on mobile (mobile contract — no fixed column counts).
 */
export default function FreeNightCertsTable({
  rows,
}: {
  rows: FreeNightCertRow[]
}) {
  if (rows.length === 0) return null

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--color-text-secondary)',
    margin: 0,
  }
  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    lineHeight: 1.45,
    color: 'var(--color-text-primary)',
    margin: '0.125rem 0 0',
  }

  const attrs: Array<[string, (r: FreeNightCertRow) => string | null]> = [
    ['Category ceiling', (r) => r.category_ceiling],
    ['Blackouts', (r) => r.blackouts],
    ['Expiry', (r) => r.expiry],
    ['Notes', (r) => r.notes ?? null],
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
      }}
    >
      {rows.map((cert, i) => (
        <article
          key={`${cert.card}-${i}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            padding: '1.25rem 1.375rem',
            background: 'var(--color-background)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {cert.card}
          </h3>
          {attrs.map(([label, get]) => {
            const v = get(cert)
            if (!v?.trim()) return null
            return (
              <div key={label}>
                <p style={labelStyle}>{label}</p>
                <p style={valueStyle}>{v}</p>
              </div>
            )
          })}
        </article>
      ))}
    </div>
  )
}
