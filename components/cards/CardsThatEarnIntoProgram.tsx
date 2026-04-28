import Link from 'next/link'
import type { CardThatEarnsIn } from '@/utils/supabase/queries'

export default function CardsThatEarnIntoProgram({
  cards,
  programName,
}: {
  cards: CardThatEarnsIn[]
  programName: string
}) {
  if (cards.length === 0) return null

  return (
    <div>
      <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Cards that earn into {programName} directly (co-branded) or via flexible-currency transfers.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {cards.map((entry) => (
          <CardTile key={entry.card.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function CardTile({ entry }: { entry: CardThatEarnsIn }) {
  const { card, issuer, relationship, current_welcome_bonus: sub } = entry
  return (
    <Link
      href={`/cards/${card.slug}`}
      style={{
        display: 'block',
        padding: '1rem 1.125rem',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-background)',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
      }}
    >
      <div
        style={{
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
          color: relationship === 'direct_co_brand' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          marginBottom: '0.375rem',
        }}
      >
        {relationship === 'direct_co_brand' ? 'Direct co-brand' : 'Via transfer partner'} · {issuer.name}
      </div>
      <div style={{ fontWeight: 600, fontSize: '1.0625rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        {card.name}
      </div>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
            Annual fee
          </div>
          <div style={{ fontWeight: 600 }}>${card.annual_fee_usd ?? '—'}</div>
        </div>
        {sub && (
          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
              Current SUB
            </div>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-ui)' }}>
              {sub.bonus_amount.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
