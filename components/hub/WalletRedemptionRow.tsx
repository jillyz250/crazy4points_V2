import Link from 'next/link'
import type { WalletRedemption } from '@/utils/supabase/whereCanIGoQueries'
import HowToBookDisclosure from '@/components/hub/HowToBookDisclosure'

const ALLIANCE_COLOR: Record<string, string> = {
  oneworld: '#C8102E',
  skyteam: '#0033A0',
  star_alliance: '#1A1A1A',
  none: '#6B2D8F',
  other: '#6B2D8F',
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
}

export default function WalletRedemptionRow({
  item,
}: {
  item: WalletRedemption
}) {
  const { row, tier, reach, miles_needed } = item
  const stripeColor = ALLIANCE_COLOR[row.operating_carrier?.alliance ?? 'none']

  return (
    <article
      style={{
        padding: '1rem 1.125rem',
        background: '#fff',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${stripeColor}`,
        borderRadius: 'var(--radius-card)',
        display: 'grid',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.0625rem',
            color: 'var(--color-primary)',
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {row.cabin} on {row.operating_carrier?.name ?? '—'}
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            color: 'var(--color-primary)',
            fontWeight: 700,
          }}
        >
          {fmt(miles_needed)}{' '}
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            {row.currency_program?.name ?? 'miles'}
          </span>
        </span>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        {row.region_or_route}
      </div>

      {tier === 'ready' && (
        <p
          style={{
            margin: 0,
            padding: '0.5rem 0.75rem',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: 'var(--radius-ui)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            lineHeight: 1.4,
          }}
        >
          ✅ You hold <strong>{fmt(reach.direct)}</strong>{' '}
          {row.currency_program?.name} — enough miles for this rate. Confirm
          space on the airline&apos;s site before booking.
        </p>
      )}

      {tier === 'one_transfer_away' && reach.oneTransferFrom && (
        <p
          style={{
            margin: 0,
            padding: '0.5rem 0.75rem',
            background: '#FEF3C7',
            color: '#78350F',
            borderRadius: 'var(--radius-ui)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            lineHeight: 1.4,
          }}
        >
          🔄 Transfer from your{' '}
          <strong>{reach.oneTransferFrom.fromSlug.toUpperCase()}</strong> balance
          ({reach.oneTransferFrom.ratio ?? 'rate varies'}). You&apos;ll end up
          with about <strong>{fmt(reach.oneTransferFrom.transferable)}</strong>{' '}
          {row.currency_program?.name} — enough for this redemption.
        </p>
      )}

      {row.teach_caption && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {row.teach_caption}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
        {row.currency_program?.slug && (
          <Link
            href={`/programs/${row.currency_program.slug}`}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            About {row.currency_program.name} →
          </Link>
        )}
        {row.operating_carrier?.slug && (
          <Link
            href={`/programs/${row.operating_carrier.slug}`}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            About {row.operating_carrier.name} →
          </Link>
        )}
      </div>

      <HowToBookDisclosure r={row} />
    </article>
  )
}
