import type { TierBenefitRow } from '@/utils/supabase/queries'

/**
 * Renders elite tiers as a responsive card grid (auto-fit, min 280px per card).
 * Each tier is self-contained: name + qualification + benefit checklist.
 * On wide screens 2-3 cards per row; on mobile, 1 per row.
 *
 * Originally a 3-column table — replaced because right-column benefits
 * with long text left big empty whitespace and were hard to scan.
 */
export default function TierBenefitsTable({
  rows,
}: {
  rows: TierBenefitRow[]
}) {
  if (rows.length === 0) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
      }}
    >
      {rows.map((tier, i) => (
        <article
          key={`${tier.name}-${i}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
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
              marginBottom: '0.25rem',
              lineHeight: 1.2,
            }}
          >
            {tier.name}
          </h3>

          {tier.qualification && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
                marginBottom: '0.875rem',
                lineHeight: 1.4,
                fontStyle: 'italic',
              }}
            >
              {tier.qualification}
            </p>
          )}

          {tier.benefits.length > 0 && (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              {tier.benefits.map((b, j) => (
                <li
                  key={j}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    lineHeight: 1.45,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      color: 'var(--color-accent)',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '0.05rem',
                      lineHeight: 1.45,
                    }}
                  >
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  )
}
