/**
 * Public-card-page banner that surfaces the CURRENT QUARTER's 5% rotating
 * categories prominently. Only renders when the card has a rotating_quarterly
 * earn rate row in credit_card_earn_rates.
 *
 * Computes which quarter is current from today's date, looks up that
 * quarter's parsed categories, and shows them with the activation deadline.
 * If the activation deadline is within 30 days, the deadline shows in red.
 */

import {
  parseRotatingCategories,
  getCurrentQuarter,
  type Quarter,
} from '@/utils/cards/rotatingCategories'

const QUARTER_RANGE: Record<Quarter, string> = {
  q1: 'Jan – Mar',
  q2: 'Apr – Jun',
  q3: 'Jul – Sep',
  q4: 'Oct – Dec',
}

export default function RotatingCategoriesBanner({
  notes,
  cardName,
}: {
  notes: string | null | undefined
  cardName: string
}) {
  if (!notes) return null
  const parsed = parseRotatingCategories(notes)
  const currentQ = getCurrentQuarter()
  const current = parsed[currentQ]

  // Nothing surfaced for this quarter — skip
  if (!current) return null

  const nextQ: Quarter =
    currentQ === 'q1' ? 'q2'
    : currentQ === 'q2' ? 'q3'
    : currentQ === 'q3' ? 'q4'
    : 'q1'
  const next = parsed[nextQ]

  return (
    <section
      style={{
        margin: '0 0 1.5rem',
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '1px solid #fbbf24',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🔄</span>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#78350f',
            margin: 0,
          }}
        >
          This quarter&apos;s 5% rotating categories
          <span
            style={{
              marginLeft: '0.5rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#92400e',
            }}
          >
            {current.label} · {QUARTER_RANGE[currentQ]}
          </span>
        </h3>
      </div>

      {current.comingSoon ? (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            color: '#78350f',
            margin: 0,
          }}
        >
          {cardName} hasn&apos;t announced this quarter&apos;s categories yet — check back closer to the start of the quarter.
        </p>
      ) : (
        <>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#78350f',
              margin: '0 0 0.5rem',
            }}
          >
            {current.categories.join(' · ')}
          </p>
          {current.activateBy ? (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: '#92400e',
                margin: 0,
              }}
            >
              ⏰ Activate by <strong>{current.activateBy}</strong>. Earn 5% on up to $1,500 in combined purchases per quarter.
            </p>
          ) : (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: '#92400e',
                margin: 0,
              }}
            >
              Earn 5% on up to $1,500 in combined purchases per quarter. Activation required.
            </p>
          )}
        </>
      )}

      {next && (next.categories.length > 0 || next.comingSoon) ? (
        <p
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #fbbf24',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: '#92400e',
          }}
        >
          <strong>Next quarter ({QUARTER_RANGE[nextQ]}):</strong>{' '}
          {next.comingSoon ? 'Coming soon' : next.categories.join(' · ')}
        </p>
      ) : null}
    </section>
  )
}
