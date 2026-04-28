import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getCardDetailBySlug } from '@/utils/supabase/queries'
import type { CreditCardBenefit } from '@/utils/supabase/queries'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const supabase = createAdminClient()
    const bundle = await getCardDetailBySlug(supabase, slug)
    if (!bundle) return { title: 'Card — crazy4points' }
    return {
      title: `${bundle.card.name} — crazy4points`,
      description: bundle.card.intro?.slice(0, 200) ?? `${bundle.card.name} review and benefits`,
    }
  } catch {
    return { title: 'Card — crazy4points' }
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
  dining: 'Dining / restaurants',
  airline_tickets: 'Airline tickets',
  local_transit: 'Local transit & commuting',
  fitness_gym: 'Fitness clubs & gyms',
  travel: 'Travel',
  travel_through_portal: 'Travel (through portal)',
  flights_through_portal: 'Flights (through portal)',
  hotels_through_portal: 'Hotels (through portal)',
  groceries: 'Groceries',
  gas: 'Gas',
  streaming: 'Streaming',
  rotating_quarterly: 'Rotating quarterly',
  everything_else: 'Everything else',
}

function formatEarnCategory(c: string): string {
  return EARN_CATEGORY_LABELS[c] ?? c.replace(/_/g, ' ')
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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

  const { card, issuer, currency_program, co_brand_program, earn_rates, benefits, current_welcome_bonus: sub } = bundle
  const benefitGroups = groupBenefits(benefits)
  const orderedCategories = BENEFIT_CATEGORY_ORDER.filter((c) => benefitGroups.has(c))
  const applyUrl = card.affiliate_url ?? card.official_url

  // TOC entries — auto-generated from sections that actually have content.
  // Required on every card detail page per plans/credit-cards-architecture.md.
  const tocSections: Array<{ id: string; label: string }> = [
    ...(sub ? [{ id: 'welcome-bonus', label: 'Welcome bonus' }] : []),
    ...(earn_rates.length > 0 ? [{ id: 'earn-rates', label: 'Earn rates' }] : []),
    ...orderedCategories.map((cat) => ({
      id: `benefit-${cat}`,
      label: BENEFIT_CATEGORY_LABELS[cat] ?? cat.replace(/_/g, ' '),
    })),
  ]

  // Schema.org structured data — CreditCard extends LoanOrCredit extends FinancialProduct.
  // Helps Google + AI assistants represent this page as a financial product, not generic content.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreditCard',
    name: card.name,
    description: card.intro?.slice(0, 500) ?? `${card.name} — review and benefits`,
    url: `https://crazy4points.com/cards/${card.slug}`,
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
      ? {
          '@type': 'Offer',
          description: `Earn ${sub.bonus_amount.toLocaleString()} ${sub.bonus_currency} after spending $${sub.spend_required_usd.toLocaleString()} in the first ${sub.spend_window_months} months.`,
        }
      : undefined,
  }

  return (
    <main className="rg-container rg-major-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          {card.card_tier && (
            <span
              style={{
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                background: 'var(--color-background-soft)',
                color: 'var(--color-text-secondary)',
                padding: '0.1875rem 0.5rem',
                borderRadius: '9999px',
              }}
            >
              {card.card_tier.replace(/_/g, ' ')}
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
          {sub && (
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>Welcome bonus</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {sub.bonus_amount.toLocaleString()} <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{sub.bonus_currency}</span>
              </div>
            </div>
          )}
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
            (Direct link to issuer — crazy4points does not currently earn a commission on this card.)
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
            padding: '1.25rem 1.5rem',
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <div
            style={{
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: '0.625rem',
            }}
          >
            Good to know before you apply
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            {card.good_to_know
              .split('\n')
              .map((line) => line.trim())
              .filter((line) => line.startsWith('- '))
              .map((line, i) => (
                <li key={i} style={{ marginBottom: '0.375rem' }}>
                  {line.slice(2)}
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Intro */}
      {card.intro && (
        <section style={{ marginBottom: '2.5rem', maxWidth: '46rem' }}>
          <p style={{ fontSize: '1.0625rem', lineHeight: 1.65 }}>{card.intro}</p>
        </section>
      )}

      {/* Welcome bonus details */}
      {sub && (
        <section id="welcome-bonus" style={{ marginBottom: '2.5rem', scrollMarginTop: '2rem' }}>
          <h2>Welcome bonus details</h2>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>{sub.bonus_amount.toLocaleString()} {sub.bonus_currency}</strong> after spending{' '}
            <strong>${sub.spend_required_usd.toLocaleString()}</strong> in the first{' '}
            <strong>{sub.spend_window_months} months</strong>.
          </p>
          {sub.extras && (
            <p style={{ color: 'var(--color-text-secondary)' }}>{sub.extras}</p>
          )}
          {sub.notes && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.75rem' }}>
              {sub.notes}
            </p>
          )}
        </section>
      )}

      {/* Earn rates */}
      {earn_rates.length > 0 && (
        <section id="earn-rates" style={{ marginBottom: '2.5rem', scrollMarginTop: '2rem' }}>
          <h2>Earn rates</h2>
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
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Channel</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {earn_rates.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 500 }}>{formatEarnCategory(r.category)}</td>
                  <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>{Number(r.multiplier)}x</td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                    {r.booking_channel === 'any' ? '—' : r.booking_channel}
                  </td>
                  <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    {r.notes ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Benefits, grouped by category */}
      {orderedCategories.map((cat) => (
        <section key={cat} id={`benefit-${cat}`} style={{ marginBottom: '2rem', scrollMarginTop: '2rem' }}>
          <h2>{BENEFIT_CATEGORY_LABELS[cat] ?? cat.replace(/_/g, ' ')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(benefitGroups.get(cat) ?? []).map((b) => (
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
        </section>
      ))}

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
          Card terms change. Confirm details on the issuer's site before applying. crazy4points does not provide financial advice.
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
