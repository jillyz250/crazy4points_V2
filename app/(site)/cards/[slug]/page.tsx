import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getCardDetailBySlug } from '@/utils/supabase/queries'
import type { CreditCardBenefit, TransferPartnerRow } from '@/utils/supabase/queries'
import { getExperienceProgramsForCard } from '@/utils/cards/getExperiencePrograms'
import TransferPartnersTable from '@/components/programs/TransferPartnersTable'
import RotatingCategoriesBanner from '@/components/cards/RotatingCategoriesBanner'
import SimpleTile from '@/components/programs/SimpleTile'

// Card editorial; stable after publish.
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const supabase = createAdminClient()
    const bundle = await getCardDetailBySlug(supabase, slug)
    if (!bundle) return { title: 'Card' }
    return {
      title: `${bundle.card.name}`,
      description: bundle.card.intro?.slice(0, 200) ?? `${bundle.card.name} review and benefits`,
    }
  } catch {
    return { title: 'Card' }
  }
}

const BENEFIT_CATEGORY_LABELS: Record<string, string> = {
  free_night: 'Free nights',
  status_conferred: 'Status',
  spend_unlock: 'Status accelerators',
  insurance: 'Travel & rental insurance',
  protection: 'Purchase & travel protection',
  statement_credit: 'Statement credits',
  travel_credit: 'Travel credits',
  lounge_access: 'Lounge access',
  portal_redemption: 'Portal redemption',
  transfer_partner_unlock: 'Transfer partner perks',
  other: 'Other',
}

const BENEFIT_CATEGORY_ORDER = [
  'free_night',
  'status_conferred',
  'spend_unlock',
  'lounge_access',
  'travel_credit',
  'statement_credit',
  'insurance',
  'protection',
  'portal_redemption',
  'transfer_partner_unlock',
  'other',
]

const EARN_CATEGORY_LABELS: Record<string, string> = {
  hyatt_purchases: 'Hyatt purchases',
  dining: 'Dining',
  dining_through_portal: 'Dining (through portal)',
  airline_tickets: 'Airline tickets',
  local_transit: 'Local transit & commuting',
  fitness_gym: 'Fitness clubs & gyms',
  travel: 'Travel',
  travel_through_portal: 'Travel (through portal)',
  flights: 'Flights',
  flights_through_portal: 'Flights (through portal)',
  hotels: 'Hotels',
  hotels_through_portal: 'Hotels (through portal)',
  groceries: 'Groceries',
  groceries_us_supermarkets: 'Groceries (US supermarkets)',
  gas: 'Gas',
  gas_stations: 'Gas stations',
  streaming: 'Streaming',
  rotating_quarterly: 'Rotating quarterly',
  everything_else: 'Everything else',
  base: 'All other purchases',
  ev_charging: 'EV charging',
  transit: 'Transit',
  takeout: 'Takeout',
  drug_stores: 'Drug stores',
  online_grocery: 'Online grocery',
  wholesale_clubs: 'Wholesale clubs',
  office_supplies: 'Office supplies',
  internet_phone_tv: 'Internet, phone & TV',
  advertising: 'Advertising',
  shipping: 'Shipping',
  car_rentals_through_portal: 'Car rentals (through portal)',
  // Brand-specific earn bonuses (some cards have these)
  peloton: 'Peloton',
  lyft: 'Lyft',
  doordash: 'DoorDash',
  uber: 'Uber',
  stubhub: 'StubHub',
  apple: 'Apple subscriptions',
  walmart: 'Walmart',
  instacart: 'Instacart',
  equinox: 'Equinox',
}

// Fallback when the slug isn't in the override map — title-cases the raw
// slug. Ensures "flights" → "Flights", "ev_charging" → "Ev Charging".
function formatEarnCategory(c: string): string {
  if (EARN_CATEGORY_LABELS[c]) return EARN_CATEGORY_LABELS[c]
  return c
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a welcome bonus amount + currency for display.
 *
 * The DB stores currency as a free-form string the extractor wrote — usually
 * 'points', 'miles', 'USD' for points/miles cards, or 'USD_cashback' for
 * cash-back cards. For cash-back currencies, render as a $ amount with no
 * suffix (since "$" already implies USD). For everything else, keep the
 * "75,000 points" / "60,000 miles" formatting.
 */
function formatWelcomeBonus(amount: number, currency: string): {
  short: string  // For tiles/previews: "$750" or "75,000 points"
  amount: string  // Just the number: "$750" or "75,000"
  unit: string  // Suffix unit: "" or "points" or "miles"
} {
  const lower = (currency ?? '').toLowerCase()
  const isCashBack =
    lower === 'usd' ||
    lower === 'usd_cashback' ||
    lower.includes('cash') ||
    lower.includes('dollar') ||
    lower === '$'
  if (isCashBack) {
    return {
      short: `$${amount.toLocaleString()}`,
      amount: `$${amount.toLocaleString()}`,
      unit: '',
    }
  }
  return {
    short: `${amount.toLocaleString()} ${currency}`,
    amount: amount.toLocaleString(),
    unit: currency,
  }
}

function groupBenefits(benefits: CreditCardBenefit[]): Map<string, CreditCardBenefit[]> {
  const groups = new Map<string, CreditCardBenefit[]>()
  for (const b of benefits) {
    const arr = groups.get(b.category) ?? []
    arr.push(b)
    groups.set(b.category, arr)
  }
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.sort_order - b.sort_order)
  }
  return groups
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createAdminClient()
  const bundle = await getCardDetailBySlug(supabase, slug)
  if (!bundle) notFound()

  const {
    card,
    issuer,
    currency_program,
    co_brand_program,
    earn_rates,
    benefits,
    current_welcome_bonus: sub,
    sibling_cards_opposite_transfer: siblingCards,
  } = bundle
  const benefitGroups = groupBenefits(benefits)
  const orderedCategories = BENEFIT_CATEGORY_ORDER.filter((c) => benefitGroups.has(c))
  const applyUrl = card.affiliate_url ?? card.official_url

  // Transfer partners: properly live on the currency program (chase-ultimate-rewards,
  // amex-membership-rewards, etc.) — every card that earns into the same currency
  // shares the same partner list. We surface them here so users see "transferring
  // is a benefit of THIS card" without bouncing to the currency program page.
  let transferPartners: TransferPartnerRow[] = []
  let programNameBySlug = new Map<string, string>()
  if (currency_program?.slug) {
    const { data: currencyRow } = await supabase
      .from('programs')
      .select('transfer_partners')
      .eq('slug', currency_program.slug)
      .maybeSingle()
    transferPartners = (currencyRow?.transfer_partners as TransferPartnerRow[] | null) ?? []

    if (transferPartners.length > 0) {
      // Look up partner names for any slug referenced in the partners list,
      // so the table renders "United MileagePlus" instead of just "united".
      const partnerSlugs = transferPartners.map((r) => r.from_slug)
      const { data: namedPrograms } = await supabase
        .from('programs')
        .select('slug, name')
        .in('slug', partnerSlugs)
      programNameBySlug = new Map((namedPrograms ?? []).map((p) => [p.slug, p.name]))
    }
  }

  // Cardholder-exclusive experience programs (Chase Experiences, United Card
  // Events, Sapphire Reserved, Bonvoy Moments, etc.). Combines issuer-wide +
  // loyalty + card-specific patterns. Empty array if the card qualifies for none.
  const experiencePrograms = await getExperienceProgramsForCard(supabase, {
    id: card.id,
    issuer_slug: issuer.slug,
    currency_program_slug: currency_program?.slug ?? null,
  })

  // TOC entries — auto-generated from sections that actually have content.
  // Required on every card detail page per plans/credit-cards-architecture.md.
  const tocSections: Array<{ id: string; label: string }> = [
    ...(sub ? [{ id: 'welcome-bonus', label: 'Welcome bonus' }] : []),
    ...(earn_rates.length > 0 ? [{ id: 'earn-rates', label: 'Earn rates' }] : []),
    // Transferable card with partners -> "Transfer partners" tile
    // Non-transferable card with sibling unlock paths -> "Unlock transfers" tile
    ...(card.points_transferable_to_partners && transferPartners.length > 0
      ? [{ id: 'transfer-partners', label: 'Transfer partners' }]
      : !card.points_transferable_to_partners && siblingCards.length > 0
        ? [{ id: 'transfer-partners', label: 'Unlock transfers' }]
        : []),
    ...orderedCategories.map((cat) => ({
      id: `benefit-${cat}`,
      label: BENEFIT_CATEGORY_LABELS[cat] ?? cat.replace(/_/g, ' '),
    })),
    ...(experiencePrograms.length > 0
      ? [{ id: 'experiences', label: 'Cardholder experiences' }]
      : []),
  ]

  // Schema.org structured data — CreditCard extends LoanOrCredit extends FinancialProduct.
  // Helps Google + AI assistants represent this page as a financial product, not generic content.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreditCard',
    name: card.name,
    description: card.intro?.slice(0, 500) ?? `${card.name} — review and benefits`,
    url: `https://www.crazy4points.com/cards/${card.slug}`,
    annualPercentageRate: '19.24-27.74',
    feesAndCommissionsSpecification: card.annual_fee_usd
      ? `Annual fee: $${card.annual_fee_usd}. Foreign transaction fee: ${card.foreign_transaction_fee_pct ?? 0}%.`
      : undefined,
    provider: {
      '@type': 'BankOrCreditUnion',
      name: issuer.name,
      url: issuer.website_url ?? undefined,
    },
    offers: sub
      ? (() => {
          const wb = formatWelcomeBonus(sub.bonus_amount, sub.bonus_currency)
          return {
            '@type': 'Offer',
            description: sub.spend_required_usd
              ? `Earn ${wb.short} after spending $${sub.spend_required_usd.toLocaleString()} in the first ${sub.spend_window_months} months.`
              : `Earn ${wb.short}${sub.spend_window_months ? ` within the first ${sub.spend_window_months} months` : ''}.${sub.extras ? ' ' + sub.extras : ''}`,
          }
        })()
      : undefined,
  }

  return (
    <main className="rg-container rg-major-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Current quarter banner — at the top, attention-grabbing for rotating-category cards. */}
      {(() => {
        const rotatingRow = earn_rates.find((r) => r.category === 'rotating_quarterly')
        if (!rotatingRow?.notes) return null
        return <RotatingCategoriesBanner notes={rotatingRow.notes} cardName={card.name} />
      })()}

      {/* Hero */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Link
            href={`/issuers/${issuer.slug}`}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            {issuer.name}
          </Link>
          {card.card_tier === 'premium' && (
            <span
              style={{
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
                color: '#fff',
                padding: '0.1875rem 0.5rem',
                borderRadius: '9999px',
                boxShadow: '0 1px 3px rgba(212, 175, 55, 0.35)',
              }}
            >
              ✨ Luxury
            </span>
          )}
          {co_brand_program && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              · co-branded with{' '}
              <Link href={`/programs/${co_brand_program.slug}`} style={{ color: 'var(--color-primary)' }}>
                {co_brand_program.name}
              </Link>
            </span>
          )}
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', marginBottom: '1rem' }}>{card.name}</h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem 3rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>Annual fee</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>${card.annual_fee_usd ?? '—'}</div>
          </div>
          {sub && (() => {
            const wb = formatWelcomeBonus(sub.bonus_amount, sub.bonus_currency)
            return (
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>Welcome bonus</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  {wb.amount}
                  {wb.unit && <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}> {wb.unit}</span>}
                </div>
              </div>
            )
          })()}
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>Foreign txn fee</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {card.foreign_transaction_fee_pct === 0 ? '0%' : card.foreign_transaction_fee_pct ? `${card.foreign_transaction_fee_pct}%` : '—'}
            </div>
          </div>
        </div>

        {applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rg-btn-primary"
            style={{ display: 'inline-block', marginBottom: '1rem' }}
          >
            Apply at {issuer.name}
          </a>
        )}
        {!card.affiliate_url && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            (Direct link to issuer does not currently earn a commission on this card.)
          </div>
        )}
      </section>

      {/* Section TOC — required on every card page (plans/credit-cards-architecture.md) */}
      {tocSections.length > 0 && (
        <nav
          aria-label="Page sections"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            padding: '0.875rem 1rem',
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            marginBottom: '2.5rem',
            position: 'sticky',
            top: '0.5rem',
            zIndex: 5,
            backdropFilter: 'blur(6px)',
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              alignSelf: 'center',
              marginRight: '0.25rem',
            }}
          >
            Jump to:
          </span>
          {tocSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                background: 'var(--color-background)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-border-soft)',
                textDecoration: 'none',
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>
      )}

      {/* Good to know callout — surfaces 3-7 things readers most often miss before applying */}
      {card.good_to_know && (
        <section
          style={{
            marginBottom: '2.5rem',
            padding: '1.25rem 1.5rem 1.375rem',
            background: 'var(--color-background-soft)',
            borderLeft: '4px solid var(--color-accent)',
            borderTop: '1px solid var(--color-border-soft)',
            borderRight: '1px solid var(--color-border-soft)',
            borderBottom: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: '0.875rem',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '1.25rem',
                height: '1.25rem',
                borderRadius: '9999px',
                background: 'var(--color-accent)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              i
            </span>
            Good to know before you apply
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
              fontSize: '0.9375rem',
              lineHeight: 1.55,
              color: 'var(--color-text-primary)',
            }}
          >
            {card.good_to_know
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.startsWith('- '))
              .map((line, i) => {
                const text = line.slice(2)
                const isWarning = /^(NO\s|Heads up|Important|Watch out|Note:)/i.test(text)
                // Bold the lead phrase — everything before the first " - " or " (" or
                // ". " — the rest is detail. Makes the bullets scannable.
                const splitMatch = text.match(/^(.*?)( - | \(|\. )(.*)$/)
                const leadPhrase = splitMatch ? splitMatch[1] : text
                const separator = splitMatch ? splitMatch[2] : ''
                const detail = splitMatch ? splitMatch[3] : ''
                return (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '0.625rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: '0.5rem',
                        height: '0.5rem',
                        borderRadius: '9999px',
                        marginTop: '0.4375rem',
                        background: isWarning
                          ? 'var(--color-accent)'
                          : 'var(--color-primary)',
                      }}
                    />
                    <span>
                      <strong style={{ fontWeight: 600 }}>{leadPhrase}</strong>
                      {separator}
                      {detail}
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      {/* Intro */}
      {card.intro && (
        <section style={{ marginBottom: '2.5rem', maxWidth: '46rem' }}>
          <p style={{ fontSize: '1.0625rem', lineHeight: 1.65 }}>{card.intro}</p>
        </section>
      )}

      {/* Tile grid — each major section becomes a clickable, expandable block */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>

      {/* Welcome bonus tile.
          Two render modes:
          - Traditional spend bonus (most cards): "X points after spending $Y in Zmo"
          - Trigger-action bonus (Freedom Rise, some starter cards): no minimum spend —
            bonus posts after autopay enrollment / first purchase / similar. In that case
            spend_required_usd is null and the trigger lives in `extras`. */}
      {sub && (() => {
        const hasSpendReq = typeof sub.spend_required_usd === 'number' && sub.spend_required_usd > 0
        const wb = formatWelcomeBonus(sub.bonus_amount, sub.bonus_currency)
        const preview = hasSpendReq
          ? `${wb.short} · $${sub.spend_required_usd!.toLocaleString()} spend in ${sub.spend_window_months}mo`
          : `${wb.short}${sub.spend_window_months ? ` · within ${sub.spend_window_months}mo` : ''} · no min spend`
        const description = hasSpendReq
          ? 'What you get for signing up and hitting the minimum spend.'
          : 'What you get for signing up — no minimum spend required.'
        return (
          <SimpleTile
            title="Welcome bonus"
            description={description}
            cta="See the offer"
            preview={preview}
          >
            {hasSpendReq ? (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>{wb.short}</strong> after spending{' '}
                <strong>${sub.spend_required_usd!.toLocaleString()}</strong> in the first{' '}
                <strong>{sub.spend_window_months} months</strong>.
              </p>
            ) : (
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>{wb.short}</strong>
                {sub.spend_window_months ? <> within the first <strong>{sub.spend_window_months} months</strong></> : null}
                . No minimum spend required.
              </p>
            )}
            {sub.extras && (
              <p style={{ color: 'var(--color-text-secondary)' }}>{sub.extras}</p>
            )}
            {sub.notes && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.75rem' }}>
                {sub.notes}
              </p>
            )}
          </SimpleTile>
        )
      })()}

      {/* Earn rates — Channel column only renders when 2+ rows have non-default values
          (otherwise the column is mostly em-dashes and adds noise; the channel restriction
          is already conveyed in each row's notes). */}
      {earn_rates.length > 0 && (() => {
        const channelRows = earn_rates.filter((r) => r.booking_channel && r.booking_channel !== 'any').length
        const showChannel = channelRows >= 2
        const maxMultiplier = Math.max(...earn_rates.map((r) => Number(r.multiplier)))
        return (
        <SimpleTile
          title="Earn rates"
          description="How many points per dollar across categories."
          cta="See the multipliers"
          preview={`${earn_rates.length} categor${earn_rates.length === 1 ? 'y' : 'ies'} · top rate ${maxMultiplier}x`}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Card-level multipliers. {currency_program && (
              <>Earn currency: <Link href={`/programs/${currency_program.slug}`} style={{ color: 'var(--color-primary)' }}>{currency_program.name}</Link>.</>
            )}
          </p>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-soft)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Category</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem' }}>Multiplier</th>
                {showChannel && (
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Channel</th>
                )}
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {earn_rates.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 500 }}>{formatEarnCategory(r.category)}</td>
                  <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>{Number(r.multiplier)}x</td>
                  {showChannel && (
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                      {r.booking_channel === 'any' ? '—' : r.booking_channel}
                    </td>
                  )}
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    {r.notes ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SimpleTile>
        )
      })()}

      {/* Transfer partners — branched on the card's points_transferable_to_partners flag.
          - Transferable card (Sapphire Preferred/Reserve, Ink Preferred/Premier, Amex MR
            cards, Venture/Venture X, etc.): full partner table + "Pool from sibling cards"
            alert when same-currency cash-earner siblings exist.
          - Non-transferable card (Freedom Rise/Flex/Unlimited, Ink Cash/Unlimited, Citi
            Custom Cash/Double Cash): partner table HIDDEN. Alert links to the premium
            sibling cards that DO transfer. */}
      {card.points_transferable_to_partners && transferPartners.length > 0 && currency_program ? (
        <SimpleTile
          title="Transfer partners"
          description={`Where you can move your ${currency_program.name} to airline + hotel programs.`}
          cta="Meet the partners"
          preview={`${transferPartners.length} partner${transferPartners.length === 1 ? '' : 's'}${transferPartners.some((p) => p.bonus_active) ? ' · 🎁 bonus active' : ''}`}
        >
          {/* No "pool from siblings" alert here — this card already transfers
              directly, so leading with a pooling note implied it was needed.
              The unlock messaging lives on the non-transferable card instead. */}
          <p style={{ marginTop: '0.25rem', marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Points earned with this card transfer to {transferPartners.length} partner program
            {transferPartners.length === 1 ? '' : 's'} via{' '}
            <Link href={`/programs/${currency_program.slug}`} style={{ color: 'var(--color-primary)' }}>
              {currency_program.name}
            </Link>
            {transferPartners.some((p) => p.bonus_active) ? ' — bonuses live now flagged below.' : '.'}
          </p>
          <TransferPartnersTable rows={transferPartners} programNameBySlug={programNameBySlug} />
        </SimpleTile>
      ) : null}

      {/* Non-transferable card unlock tile — alert-only, no partner table.
          Renders ONLY when the card itself can't transfer AND has at least one
          sibling that can (so we have somewhere to send the user). */}
      {!card.points_transferable_to_partners && siblingCards.length > 0 && currency_program ? (
        <SimpleTile
          title="Unlock transfers"
          description={`Pair this card with a travel card in the ${currency_program.name} family to unlock transfers to airline + hotel partners.`}
          cta="See your unlock cards"
          preview={`Pair with a travel card to unlock partners`}
        >
          <div
            style={{
              background: 'var(--color-background-soft)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-card)',
              padding: '1rem 1.25rem',
              marginBottom: '1rem',
              fontSize: '0.9375rem',
            }}
          >
            <p style={{ marginBottom: '0.75rem' }}>
              <strong>💡 Pair with another travel card to unlock transfer partners.</strong>{' '}
              Points earned on this card become transferable to airline + hotel partners
              when you combine them into one of these {currency_program.name} travel cards:
            </p>
            <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.25rem' }}>
              {siblingCards.map((s) => (
                <li key={s.slug} style={{ marginBottom: '0.25rem' }}>
                  <Link href={`/cards/${s.slug}`} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              You can combine across your own personal + business cards from the same issuer (Chase
              allows household-member pooling too with a one-time setup; Citi keeps it to your own
              cards only). Check your issuer&apos;s rules for details.
            </p>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Without one of the travel cards above, points on this card redeem at fixed
            cash-back / portal value only.
          </p>
        </SimpleTile>
      ) : null}

      {/* Cardholder experience programs — issuer-wide + loyalty + card-specific
          access portals (Chase Experiences, United Card Events, Sapphire Reserved,
          Marriott Bonvoy Moments, etc.). Each program is an external portal the
          cardholder can browse for events / dining / access. */}
      {experiencePrograms.length > 0 && (
        <SimpleTile
          title="Cardholder experiences"
          description="Members-only events, dining access, and special experiences bundled with this card."
          cta="Browse the portals"
          preview={`${experiencePrograms.length} program${experiencePrograms.length === 1 ? '' : 's'}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {experiencePrograms.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-card)',
                  padding: '1rem 1.25rem',
                  background: 'var(--color-background)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  <a
                    href={p.official_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{ fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
                  >
                    {p.name} →
                  </a>
                  {p.access_tier && (
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        background: p.access_tier === 'invite_only'
                          ? 'var(--color-accent)'
                          : p.access_tier === 'premium'
                            ? 'var(--color-primary)'
                            : 'var(--color-background-soft)',
                        color: p.access_tier === 'invite_only'
                          ? '#3a2b00'
                          : p.access_tier === 'premium'
                            ? 'white'
                            : 'var(--color-text-secondary)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        fontWeight: 600,
                      }}
                    >
                      {p.access_tier === 'invite_only' ? 'Invite-only' : p.access_tier}
                    </span>
                  )}
                </div>
                {p.description && (
                  <div style={{ fontSize: '0.9375rem', lineHeight: 1.55, color: 'var(--color-text-primary)' }}>
                    {p.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SimpleTile>
      )}

      {/* Benefits, grouped by category — each category becomes its own tile */}
      {orderedCategories.map((cat) => {
        const benefitsInCat = benefitGroups.get(cat) ?? []
        if (benefitsInCat.length === 0) return null
        const label = BENEFIT_CATEGORY_LABELS[cat] ?? cat.replace(/_/g, ' ')
        return (
          <SimpleTile
            key={cat}
            title={label}
            description={
              cat === 'insurance' ? 'Trip protection, rental car coverage, baggage, accident coverage.'
              : cat === 'statement_credit' ? 'Bill credits and recurring perks that offset annual fees.'
              : cat === 'travel_credit' ? 'Annual travel-spend credits and portal incentives.'
              : cat === 'protection' ? 'Purchase, extended warranty, cell phone, and fraud protections.'
              : cat === 'lounge_access' ? 'Airport lounge access conferred by this card.'
              : cat === 'free_night' ? 'Annual free night certificates and similar.'
              : cat === 'status_conferred' ? 'Hotel / airline / partner status this card grants.'
              : cat === 'spend_unlock' ? 'Perks that unlock at spending milestones.'
              : cat === 'portal_redemption' ? 'Boosted point value when redeeming via the issuer portal.'
              : cat === 'transfer_partner_unlock' ? 'Partners this card unlocks for point transfer.'
              : 'Other perks on this card.'
            }
            cta="See the details"
            preview={`${benefitsInCat.length} benefit${benefitsInCat.length === 1 ? '' : 's'}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {benefitsInCat.map((b) => (
                <div
                  key={b.id}
                  style={{
                    border: '1px solid var(--color-border-soft)',
                    borderRadius: 'var(--radius-card)',
                    padding: '1rem 1.25rem',
                    background: 'var(--color-background)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{b.name}</div>
                  {b.description && (
                    <div style={{ fontSize: '0.9375rem', lineHeight: 1.55, color: 'var(--color-text-primary)' }}>
                      {b.description}
                    </div>
                  )}
                  {b.spend_threshold_usd && Number(b.spend_threshold_usd) > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      Unlocks at ${Number(b.spend_threshold_usd).toLocaleString()} spend
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SimpleTile>
        )
      })}
      </div>{/* end tile grid */}

      {/* Footer / verification */}
      <footer
        style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-border-soft)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        {card.last_verified && (
          <p>Last verified {formatDate(card.last_verified)}.</p>
        )}
        <p>
          Card terms change. Confirm details on the issuer&apos;s site before applying. crazy4points does not provide financial advice. We are not responsible for application outcomes or terms accepted — see our <a href="/terms" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Terms of Service</a> for full details.
        </p>
        {!card.affiliate_url && (
          <p style={{ marginTop: '0.5rem' }}>
            We don't currently earn a commission on this card. The Apply button links to the issuer directly.
          </p>
        )}
      </footer>
    </main>
  )
}
