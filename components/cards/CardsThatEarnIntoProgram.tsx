import Link from 'next/link'
import type { CardThatEarnsIn } from '@/utils/supabase/queries'

// No real card art exists yet (image_url is empty across the table), so each tile
// gets a stylized mini "card face" in the ISSUER's brand color — a gradient + a
// gold chip + the issuer logo/name — so the list reads as a wall of cards instead
// of flat text boxes. Keyed on issuer slug; falls back to the house purple.
const ISSUER_GRADIENT: Record<string, [string, string]> = {
  chase: ['#0b4c8c', '#1476c6'],
  amex: ['#00175a', '#016fd0'],
  'american-express': ['#00175a', '#016fd0'],
  citi: ['#003b7e', '#0a6bb0'],
  'capital-one': ['#7c1a1a', '#d03027'],
  barclays: ['#00395d', '#0a9ed9'],
  'bank-of-america': ['#012169', '#c8102e'],
  bofa: ['#012169', '#c8102e'],
  'wells-fargo': ['#7c1622', '#d71e28'],
  'u-s-bank': ['#0c2074', '#1b3fae'],
  'us-bank': ['#0c2074', '#1b3fae'],
  bilt: ['#141414', '#3a3a3a'],
  synchrony: ['#1a3d1f', '#3a8f4a'],
}
function gradientFor(slug: string | null | undefined): [string, string] {
  return (slug && ISSUER_GRADIENT[slug]) || ['#4a2a6a', '#6b2d8f']
}

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
        Cards that earn {programName} directly, or that transfer into it from a flexible-currency program.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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

/** A mini credit-card visual in the issuer's brand color: gradient + chip + logo. */
function CardFace({ issuer }: { issuer: CardThatEarnsIn['issuer'] }) {
  const [from, to] = gradientFor(issuer.slug)
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: '104px',
        aspectRatio: '1.586',
        flexShrink: 0,
        borderRadius: '9px',
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: '0 4px 10px -3px rgba(26,26,26,0.35)',
        overflow: 'hidden',
      }}
    >
      {/* chip */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '11px',
          width: '17px',
          height: '13px',
          borderRadius: '3px',
          background: 'linear-gradient(135deg, #f4d77e, #c9a227)',
        }}
      />
      {/* subtle sheen */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(120deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 45%)',
        }}
      />
      {/* issuer logo (white-boxed) or name */}
      {issuer.logo_url ? (
        <span
          style={{
            position: 'absolute',
            right: '8px',
            bottom: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 3px',
            borderRadius: '3px',
            background: 'rgba(255,255,255,0.92)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={issuer.logo_url} alt="" width={22} height={12} style={{ height: '12px', width: 'auto', objectFit: 'contain' }} />
        </span>
      ) : (
        <span
          style={{
            position: 'absolute',
            right: '9px',
            bottom: '7px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.5rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {issuer.name}
        </span>
      )}
    </div>
  )
}

function CardTile({ entry }: { entry: CardThatEarnsIn }) {
  const { card, issuer, relationship, current_welcome_bonus: sub } = entry
  const relLabel =
    relationship === 'direct_co_brand'
      ? 'Direct co-brand'
      : relationship === 'direct_earn'
        ? 'Earns directly'
        : 'Via transfer partner'
  return (
    <Link
      href={`/cards/${card.slug}`}
      className="rg-card-tile"
      style={{
        display: 'flex',
        gap: '0.875rem',
        alignItems: 'center',
        padding: '0.9375rem',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-background)',
        boxShadow: 'var(--shadow-soft)',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
      }}
    >
      <CardFace issuer={issuer} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '0.625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 700,
            color: relationship === 'transfer_partner' ? 'var(--color-text-secondary)' : 'var(--color-primary)',
            marginBottom: '0.25rem',
          }}
        >
          {relLabel} · {issuer.name}
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.5rem', lineHeight: 1.25 }}>{card.name}</div>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
              Annual fee
            </div>
            <div style={{ fontWeight: 700 }}>{card.annual_fee_usd != null ? `$${card.annual_fee_usd}` : '—'}</div>
          </div>
          {sub && (
            <div>
              <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                Current SUB
              </div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--color-primary)' }}>
                {sub.bonus_amount.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
