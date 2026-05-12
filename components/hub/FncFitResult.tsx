import type { HotelProperty } from '@/utils/supabase/queries'
import type { CertDef, FitResult } from '@/lib/fncCerts'

const VERDICT_STYLE = {
  fits: { bg: '#D1FAE5', fg: '#065F46', label: 'Fits' },
  fits_with_topup: { bg: '#FEF3C7', fg: '#78350F', label: 'Fits with top-up' },
  doesnt_fit: { bg: '#FECACA', fg: '#7F1D1D', label: "Doesn't fit" },
} as const

const VALUE_STYLE = {
  great: { bg: '#D1FAE5', fg: '#065F46', label: 'Great use of a cert' },
  good: { bg: 'var(--color-background-soft)', fg: 'var(--color-text-secondary)', label: 'Fine value' },
  wasting: { bg: '#FED7AA', fg: '#7C2D12', label: "You're under-using it" },
  unknown: { bg: 'var(--color-background-soft)', fg: 'var(--color-text-secondary)', label: '' },
} as const

function fmtPoints(n: number | null | undefined): string {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
}

export default function FncFitResult({
  property,
  cert,
  fit,
}: {
  property: HotelProperty
  cert: CertDef
  fit: FitResult
}) {
  const v = VERDICT_STYLE[fit.verdict]
  const value = VALUE_STYLE[fit.valueRating]

  return (
    <article
      style={{
        padding: '1.25rem',
        background: '#fff',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        display: 'grid',
        gap: '0.875rem',
      }}
    >
      {/* Expiry hint — the whole point of this tool is to beat expiry,
          so we lead with it. Surfaced top-of-card before verdict. */}
      {cert.expiryHint && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '0.625rem 0.875rem',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-ui)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)',
            lineHeight: 1.45,
          }}
        >
          <span aria-hidden style={{ fontSize: '0.9375rem', lineHeight: 1 }}>⏳</span>
          <span><strong>Expiry check first:</strong> {cert.expiryHint}</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1875rem',
              color: 'var(--color-primary)',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {property.name}
          </h3>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.25rem',
            }}
          >
            {[property.brand, property.city, property.country]
              .filter(Boolean)
              .join(' · ')}
            {property.category && ` · Category ${property.category}`}
          </div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            background: v.bg,
            color: v.fg,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {v.label}
        </span>
      </div>

      {/* Verdict explainer */}
      <div
        style={{
          padding: '0.875rem 1rem',
          background: 'var(--color-background-soft)',
          borderRadius: 'var(--radius-ui)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          color: 'var(--color-text-primary)',
          lineHeight: 1.5,
        }}
      >
        {fit.verdict === 'fits' && (
          <span>
            Your <strong>{cert.label}</strong> covers this property at the
            standard rate. Book it.
          </span>
        )}
        {fit.verdict === 'fits_with_topup' && (
          <span>
            Your <strong>{cert.label}</strong> is short by{' '}
            <strong>{fit.topupPoints?.toLocaleString()} points</strong>.
            {cert.topupMax && cert.topupMax < 999_000 ? (
              <>
                {' '}This program allows up to{' '}
                <strong>{cert.topupMax.toLocaleString()} points</strong>{' '}
                top-up — pay the gap and the cert still works.
              </>
            ) : (
              <> Pay the gap with points (or points + cash where supported) and the cert still works.</>
            )}
          </span>
        )}
        {fit.verdict === 'doesnt_fit' && (
          <span>
            Your <strong>{cert.label}</strong> doesn&apos;t cover this
            property. We&apos;ll surface alternatives below.
          </span>
        )}
      </div>

      {/* Property rate card */}
      {cert.matchModel === 'points' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(7rem, 1fr))',
            gap: '0.5rem',
          }}
        >
          <RateCell label="Off-peak" value={fmtPoints(property.off_peak_points)} />
          <RateCell label="Standard" value={fmtPoints(property.standard_points)} emphasis />
          <RateCell label="Peak" value={fmtPoints(property.peak_points)} />
        </div>
      )}
      {cert.matchModel === 'category' && property.category && (
        <div
          style={{
            padding: '0.625rem 0.875rem',
            background: 'var(--color-background-soft)',
            borderRadius: 'var(--radius-ui)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          Hyatt category {property.category}. Off-peak{' '}
          {fmtPoints(property.off_peak_points)} / Standard{' '}
          {fmtPoints(property.standard_points)} / Peak{' '}
          {fmtPoints(property.peak_points)}. Your cert covers any night
          regardless of date.
        </div>
      )}

      {fit.valueRating !== 'unknown' && value.label && fit.verdict !== 'doesnt_fit' && (
        <span
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            background: value.bg,
            color: value.fg,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {value.label}
        </span>
      )}

      {fit.valueRating === 'wasting' && fit.verdict === 'fits' && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          This property is well under your cert&apos;s cap. You&apos;d get more
          value saving the cert for a pricier stay.
        </p>
      )}

      {cert.feesNote && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          {cert.feesNote}
        </p>
      )}
    </article>
  )
}

function RateCell({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div
      style={{
        padding: '0.625rem',
        background: emphasis ? 'var(--color-primary)' : 'var(--color-background-soft)',
        color: emphasis ? '#fff' : 'var(--color-text-primary)',
        borderRadius: 'var(--radius-ui)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.625rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          opacity: 0.8,
          marginBottom: '0.125rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.125rem',
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  )
}
