import Link from 'next/link'
import type { CardThatEarnsIn } from '@/utils/supabase/queries'
import CardFace from './CardFace'

// No real card art exists yet (image_url is empty table-wide), so each row leads
// with a stylized mini card-face in the issuer's brand color, sitting on a white
// tile with a brand-tinted shadow so it pops. The bonus is a purple pill, the
// annual fee is quiet text, and a gold Apply button (our affiliate link) anchors
// the right. Gradient keyed on issuer slug; house-purple fallback.
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
function bonusUnit(currency: string | null | undefined): string {
  const c = (currency ?? '').toLowerCase()
  if (/mile/.test(c)) return 'miles'
  if (/point/.test(c)) return 'points'
  return 'bonus'
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
        {cards.map((entry) => (
          <CardTile key={entry.card.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function CardTile({ entry }: { entry: CardThatEarnsIn }) {
  const { card, issuer, relationship, current_welcome_bonus: sub } = entry
  const [faceFrom, faceTo] = gradientFor(issuer.slug)
  const relLabel =
    relationship === 'direct_co_brand'
      ? 'Direct co-brand'
      : relationship === 'direct_earn'
        ? 'Earns directly'
        : 'Via transfer partner'
  const applyHref = (card.affiliate_url ?? '').trim() || null
  return (
    <div
      className="rg-card-tile"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '15px 16px',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-background)',
        border: '1px solid var(--color-border-soft)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <Link
        href={`/cards/${card.slug}`}
        style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0, textDecoration: 'none', color: 'var(--color-text-primary)' }}
      >
        <CardFace from={faceFrom} to={faceTo} logoUrl={issuer.logo_url} width={90} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: relationship === 'transfer_partner' ? 'var(--color-text-secondary)' : 'var(--color-primary)' }}>
            {relLabel} · {issuer.name}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.2, margin: '3px 0 7px' }}>{card.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {sub && (
              <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '20px', background: 'color-mix(in srgb, var(--color-primary) 12%, white)', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-ui)' }}>
                +{sub.bonus_amount.toLocaleString()} {bonusUnit(sub.bonus_currency)}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {card.annual_fee_usd != null ? `$${card.annual_fee_usd} annual fee` : 'Annual fee n/a'}
            </span>
          </div>
        </div>
      </Link>
      {applyHref ? (
        <a
          href={applyHref}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="rg-tap-target"
          style={{ flexShrink: 0, display: 'inline-block', padding: '9px 16px', borderRadius: 'var(--radius-ui)', background: 'var(--color-accent)', color: '#1A1A1A', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none' }}
        >
          Apply &rarr;
        </a>
      ) : (
        <Link
          href={`/cards/${card.slug}`}
          className="rg-tap-target"
          style={{ flexShrink: 0, display: 'inline-block', padding: '9px 16px', borderRadius: 'var(--radius-ui)', border: '1.5px solid var(--color-primary)', color: 'var(--color-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none' }}
        >
          Details &rarr;
        </Link>
      )}
    </div>
  )
}
