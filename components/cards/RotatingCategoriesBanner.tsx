/**
 * Public-card-page banner that surfaces the CURRENT QUARTER's 5% rotating
 * categories prominently AT THE TOP of the page. Only renders when the card
 * has a rotating_quarterly earn rate row in credit_card_earn_rates.
 *
 * Visual treatment: gold-on-purple gradient + animated "LIVE" pulse to grab
 * attention. Designed to feel like a "live promo" indicator — the rotating
 * categories ARE time-sensitive content and deserve prime placement.
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
        margin: '0 0 2rem',
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #6B2D8F 0%, #4A1F66 100%)',
        borderRadius: 'var(--radius-card)',
        boxShadow: '0 4px 16px rgba(107, 45, 143, 0.25)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top-right gold accent */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* LIVE pill + quarter label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: '#D4AF37',
            color: '#1A1A1A',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '0.5rem',
              height: '0.5rem',
              background: '#dc2626',
              borderRadius: '9999px',
              boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)',
              animation: 'rcb-pulse 1.8s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          Live this quarter
        </span>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.75)',
          }}
        >
          {current.label} · {QUARTER_RANGE[currentQ]}
        </span>
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#fff',
          margin: '0 0 0.5rem',
          lineHeight: 1.2,
        }}
      >
        5x rotating category bonus
      </h2>

      {current.comingSoon ? (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            color: 'rgba(255, 255, 255, 0.85)',
            margin: 0,
          }}
        >
          {cardName} hasn&apos;t announced this quarter&apos;s categories yet — check back closer to the start of the quarter.
        </p>
      ) : (
        <>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.625rem',
              fontWeight: 600,
              color: '#D4AF37',
              margin: '0 0 0.5rem',
              lineHeight: 1.25,
            }}
          >
            {current.categories.join(' · ')}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: 'rgba(255, 255, 255, 0.85)',
              margin: 0,
            }}
          >
            {current.activateBy ? (
              <>
                ⏰ <strong style={{ color: '#fff' }}>Activate by {current.activateBy}</strong>.{' '}
              </>
            ) : null}
            Earn 5% on up to $1,500 in combined purchases each quarter (then 1%). Activation required.
          </p>
        </>
      )}

      {next && (next.categories.length > 0 || next.comingSoon) ? (
        <p
          style={{
            marginTop: '0.875rem',
            paddingTop: '0.875rem',
            borderTop: '1px solid rgba(212, 175, 55, 0.3)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'rgba(255, 255, 255, 0.7)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <strong style={{ color: 'rgba(212, 175, 55, 0.9)' }}>Next ({QUARTER_RANGE[nextQ]}):</strong>{' '}
          {next.comingSoon ? 'Coming soon — Chase announces ~6 weeks ahead' : next.categories.join(' · ')}
        </p>
      ) : null}

      {/* Pulse animation for the LIVE dot */}
      <style>{`
        @keyframes rcb-pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>
    </section>
  )
}
