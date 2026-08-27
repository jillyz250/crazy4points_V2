import Link from 'next/link'
import type { CardThatEarnsIn } from '@/utils/supabase/queries'

// No real card art exists yet (image_url is empty table-wide), so each row is a
// three-zone tile: a brand-colored panel holding a stylized mini card-face, the
// card name in the middle, and the sign-up bonus as a gold hero on the right (the
// number people actually shop on). Gradient keyed on issuer slug; house-purple
// fallback.
const ISSUER_GRADIENT: Record<string, [string, string]> = {
  chase: ['#0b3a6b', '#1476c6'],
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
  return (slug && ISSUER_GRADIENT[slug]) || ['#3a1c5a', '#6b2d8f']
}

function bonusLabel(currency: string | null | undefined): string {
  const c = (currency ?? '').toLowerCase()
  if (/mile/.test(c)) return 'Bonus miles'
  if (/point/.test(c)) return 'Bonus points'
  return 'Sign-up bonus'
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {cards.map((entry) => (
          <CardTile key={entry.card.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

/** A mini credit-card visual in the issuer's brand color: gradient + chip + logo. */
function CardFace({ issuer, width = 88 }: { issuer: CardThatEarnsIn['issuer']; width?: number }) {
  const [from, to] = gradientFor(issuer.slug)
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: `${width}px`,
        aspectRatio: '1.586',
        flexShrink: 0,
        borderRadius: '8px',
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        // A light hairline edge + a strong shadow so the card lifts off the
        // (darker) brand panel instead of blending into it.
        border: '1px solid rgba(255,255,255,0.38)',
        boxShadow: '0 7px 16px -4px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '9px', left: '8px', width: '14px', height: '11px', borderRadius: '2px', background: 'linear-gradient(135deg, #f4d77e, #c9a227)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 46%)' }} />
      {issuer.logo_url ? (
        <span
          style={{
            position: 'absolute',
            right: '6px',
            bottom: '5px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            borderRadius: '3px',
            background: 'rgba(255,255,255,0.94)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={issuer.logo_url} alt="" width={13} height={13} style={{ height: '13px', width: 'auto', objectFit: 'contain' }} />
        </span>
      ) : (
        <span style={{ position: 'absolute', right: '8px', bottom: '6px', fontFamily: 'var(--font-ui)', fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
          {issuer.name}
        </span>
      )}
    </div>
  )
}

function CardTile({ entry }: { entry: CardThatEarnsIn }) {
  const { card, issuer, relationship, current_welcome_bonus: sub } = entry
  const [from, to] = gradientFor(issuer.slug)
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
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-background)',
        border: '1px solid var(--color-border-soft)',
        boxShadow: 'var(--shadow-soft)',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Zone 1 — brand panel (darkened so the brighter card-face pops off it) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 16px',
          backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${from} 68%, #000), color-mix(in srgb, ${to} 68%, #000))`,
          flexShrink: 0,
        }}
      >
        <CardFace issuer={issuer} width={86} />
      </div>

      {/* Zone 2 — relationship, name, annual fee */}
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 16px' }}>
        <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: relationship === 'transfer_partner' ? 'var(--color-text-secondary)' : 'var(--color-primary)' }}>
          {relLabel} · {issuer.name}
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.2, margin: '3px 0 5px' }}>{card.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          Annual fee <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{card.annual_fee_usd != null ? `$${card.annual_fee_usd}` : '—'}</span>
        </div>
      </div>

      {/* Zone 3 — sign-up bonus hero (gold), only when there is one */}
      {sub && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '12px 18px', background: '#fbf3dd', borderLeft: '1px solid #f0e2b8', flexShrink: 0, textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7a5c0b', lineHeight: 1, fontFamily: 'var(--font-ui)' }}>
            {sub.bonus_amount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.5625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a07d1a', marginTop: '3px' }}>
            {bonusLabel(sub.bonus_currency)}
          </div>
        </div>
      )}
    </Link>
  )
}
