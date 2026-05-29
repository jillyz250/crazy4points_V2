import Link from 'next/link'
import type { EarnOption } from '@/utils/supabase/earnPathQueries'

const KIND_STYLE = {
  transfer_bonus: {
    label: 'Active transfer bonus',
    bg: 'linear-gradient(135deg, #FEF9E7 0%, #FFF 80%)',
    accent: '#F5C300',
    icon: '🎯',
  },
  transferable_inbound: {
    label: 'Transfer in',
    bg: '#fff',
    accent: '#6B2D8F',
    icon: '🔄',
  },
  co_brand_card: {
    label: 'Co-brand card SUB',
    bg: '#fff',
    accent: '#1E3A8A',
    icon: '💳',
  },
} as const

export default function EarnPathOptionCard({ option }: { option: EarnOption }) {
  const style = KIND_STYLE[option.kind]
  return (
    <article
      style={{
        padding: '1.125rem',
        background: style.bg,
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${style.accent}`,
        borderRadius: 'var(--radius-card)',
        display: 'grid',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            padding: '0.1875rem 0.5rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.625rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: style.accent,
            background: 'var(--color-background-soft)',
            borderRadius: '999px',
          }}
        >
          {style.icon} {style.label}
        </span>
      </div>

      {option.kind === 'transfer_bonus' && (
        <TransferBonusOption option={option} />
      )}
      {option.kind === 'transferable_inbound' && (
        <TransferableInboundOption option={option} />
      )}
      {option.kind === 'co_brand_card' && <CoBrandCardOption option={option} />}
    </article>
  )
}

function TransferBonusOption({
  option,
}: {
  option: Extract<EarnOption, { kind: 'transfer_bonus' }>
}) {
  const a = option.alert
  const daysLeft = a.end_date
    ? Math.ceil((new Date(a.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  return (
    <>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.0625rem',
          color: 'var(--color-primary)',
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {a.title}
      </h3>
      {a.summary && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {a.summary.length > 220 ? `${a.summary.slice(0, 217)}…` : a.summary}
        </p>
      )}
      {daysLeft != null && daysLeft >= 0 && (
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '0.1875rem 0.5rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: daysLeft <= 7 ? '#7F1D1D' : 'var(--color-text-secondary)',
            background: daysLeft <= 7 ? '#FECACA' : 'var(--color-background-soft)',
            borderRadius: '999px',
          }}
        >
          {daysLeft === 0 ? 'Ends today' : `${daysLeft} days left`}
        </span>
      )}
      <Link
        href="/hub/should-i-transfer"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-primary)',
          textDecoration: 'none',
        }}
      >
        See live Transfer Bonuses →
      </Link>
    </>
  )
}

function TransferableInboundOption({
  option,
}: {
  option: Extract<EarnOption, { kind: 'transferable_inbound' }>
}) {
  return (
    <>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.0625rem',
          color: 'var(--color-primary)',
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        Transfer from{' '}
        <Link href={`/programs/${option.fromProgramSlug}`}>
          {option.fromProgramName}
        </Link>{' '}
        {option.ratio && (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            ({option.ratio})
          </span>
        )}
      </h3>
      {option.notes && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {option.notes}
        </p>
      )}
      {option.bonusActive && (
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '0.1875rem 0.5rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#78350F',
            background: '#FEF3C7',
            borderRadius: '999px',
          }}
        >
          Bonus active — check rate
        </span>
      )}
    </>
  )
}

function CoBrandCardOption({
  option,
}: {
  option: Extract<EarnOption, { kind: 'co_brand_card' }>
}) {
  const fmt = (n: number | null) =>
    n == null
      ? null
      : n >= 1000
        ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
        : String(n)
  return (
    <>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.0625rem',
          color: 'var(--color-primary)',
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {option.cardName}
      </h3>
      {(option.welcomeBonusMiles || option.welcomeBonusSpendReq) && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {option.welcomeBonusMiles && (
            <strong>{fmt(option.welcomeBonusMiles)} miles SUB</strong>
          )}
          {option.welcomeBonusSpendReq && (
            <>
              {' '}
              after ${option.welcomeBonusSpendReq.toLocaleString()} spend
            </>
          )}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        {option.issuerName && (
          <span
            style={{
              padding: '0.1875rem 0.5rem',
              background: 'var(--color-background-soft)',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            {option.issuerName}
          </span>
        )}
        {option.annualFee != null && (
          <span
            style={{
              padding: '0.1875rem 0.5rem',
              background:
                option.annualFee === 0 ? '#D1FAE5' : 'var(--color-background-soft)',
              color: option.annualFee === 0 ? '#065F46' : 'var(--color-text-secondary)',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            {option.annualFee === 0 ? 'No AF' : `$${option.annualFee} AF`}
          </span>
        )}
      </div>
      {option.slug && (
        <Link
          href={`/cards/${option.slug}`}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            textDecoration: 'none',
          }}
        >
          See card details →
        </Link>
      )}
    </>
  )
}
