/**
 * /issuers/[slug] — public issuer (bank) hub page.
 *
 * Phase 2 of the issuer-hub architecture. Auto-derives three sections
 * from existing tables — no per-issuer card maintenance needed beyond
 * pointing each card row at the right `issuer_id`:
 *
 *   1. Issuer intro (authored at /admin/issuers/[slug])
 *   2. Active alerts tagged with the issuer's flexible currency OR any
 *      co-brand program this issuer issues for
 *   3. Cards grouped:
 *        - "Earn [issuer flexible currency]" — flexible-currency cards
 *        - "Co-brand cards" — grouped by partner program name
 *
 * Renders even when the issuer row is a stub (no intro) — the auto-
 * derived sections still surface useful data while editorial copy is
 * being filled in.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { SITE_URL } from '@/lib/constants'

export const revalidate = 3600

type IssuerRow = {
  id: string
  slug: string
  name: string
  intro: string | null
  website_url: string | null
  logo_url: string | null
  last_verified: string | null
  updated_at: string
}

type CardRow = {
  id: string
  slug: string
  name: string
  intro: string | null
  image_url: string | null
  annual_fee_usd: number | null
  card_type: 'personal' | 'business'
  card_tier: string | null
  currency_program_id: string | null
  co_brand_program_id: string | null
}

type ProgramLite = { id: string; slug: string; name: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const supabase = createAdminClient()
    const { data: issuer } = await supabase
      .from('issuers')
      .select('name, intro')
      .eq('slug', slug)
      .maybeSingle()
    if (!issuer) return { title: 'Issuer' }
    const cleanIntro = issuer.intro
      ? (issuer.intro as string).replace(/\s+/g, ' ').trim().slice(0, 155)
      : null
    const description =
      cleanIntro ??
      `${issuer.name} — credit card lineup, transfer partners, and current alerts. Curated by crazy4points.`
    const url = `${SITE_URL}/issuers/${slug}`
    return {
      title: issuer.name as string,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: issuer.name as string,
        description,
        url,
        type: 'website',
        siteName: 'crazy4points',
      },
      twitter: {
        card: 'summary_large_image',
        title: issuer.name as string,
        description,
      },
    }
  } catch {
    return { title: 'Issuer' }
  }
}

function formatAF(af: number | null): string {
  if (af === null) return ''
  if (af === 0) return '$0 AF'
  return `$${af} AF`
}

function formatLastVerified(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default async function IssuerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createAdminClient()

  // 1. Issuer row
  const { data: issuerRow } = await supabase
    .from('issuers')
    .select('id, slug, name, intro, website_url, logo_url, last_verified, updated_at')
    .eq('slug', slug)
    .maybeSingle()
  if (!issuerRow) notFound()
  const issuer = issuerRow as IssuerRow

  // 2. All cards this issuer offers
  const { data: cardRows } = await supabase
    .from('credit_cards')
    .select('id, slug, name, intro, image_url, annual_fee_usd, card_type, card_tier, currency_program_id, co_brand_program_id')
    .eq('issuer_id', issuer.id)
    .eq('is_active', true)
    .order('annual_fee_usd', { ascending: false, nullsFirst: false })
  const cards = (cardRows ?? []) as CardRow[]

  // 3. Look up the program rows referenced by these cards (currency + co-brand)
  // so we can render real partner names instead of raw UUIDs in the groupings.
  const programIds = new Set<string>()
  for (const c of cards) {
    if (c.currency_program_id) programIds.add(c.currency_program_id)
    if (c.co_brand_program_id) programIds.add(c.co_brand_program_id)
  }
  const programsById = new Map<string, ProgramLite>()
  if (programIds.size > 0) {
    const { data: progRows } = await supabase
      .from('programs')
      .select('id, slug, name')
      .in('id', [...programIds])
    for (const p of (progRows ?? []) as ProgramLite[]) programsById.set(p.id, p)
  }

  // 4. Split cards into flexible (currency_program_id set) vs co-brand (co_brand_program_id set).
  // A card with both set: treat as co-brand (rare; surface caveat in notes).
  const flexibleCards: CardRow[] = []
  const cobrandByPartner = new Map<string, { partner: ProgramLite; cards: CardRow[] }>()
  for (const c of cards) {
    if (c.co_brand_program_id) {
      const partner = programsById.get(c.co_brand_program_id)
      if (!partner) continue
      const existing = cobrandByPartner.get(partner.id)
      if (existing) existing.cards.push(c)
      else cobrandByPartner.set(partner.id, { partner, cards: [c] })
    } else if (c.currency_program_id) {
      flexibleCards.push(c)
    } else {
      // No currency, no co-brand — treat as "other"; bucket under flexible for now
      flexibleCards.push(c)
    }
  }

  // Find the issuer's flexible currency (if any) by sampling a flexible card
  const issuerCurrency = flexibleCards.find((c) => c.currency_program_id)?.currency_program_id
    ? programsById.get(flexibleCards.find((c) => c.currency_program_id)!.currency_program_id!)
    : null

  // 5. Active alerts tagged with the issuer's currency OR any co-brand partner.
  // Cheap query — pulls every active alert and filters by tagged primary_program_id.
  const relevantProgramIds = new Set<string>()
  if (issuerCurrency) relevantProgramIds.add(issuerCurrency.id)
  for (const { partner } of cobrandByPartner.values()) relevantProgramIds.add(partner.id)

  type AlertRow = { slug: string; title: string; summary: string | null; type: string; end_date: string | null }
  let activeAlerts: AlertRow[] = []
  if (relevantProgramIds.size > 0) {
    const { data: alertRows } = await supabase
      .from('alerts')
      .select('slug, title, summary, type, end_date, primary_program_id')
      .eq('status', 'published')
      .in('primary_program_id', [...relevantProgramIds])
      .order('published_at', { ascending: false })
      .limit(8)
    activeAlerts = (alertRows ?? []) as AlertRow[]
  }

  // Co-brand partners sorted alphabetically by name
  const cobrandSorted = [...cobrandByPartner.values()].sort((a, b) =>
    a.partner.name.localeCompare(b.partner.name),
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: issuer.name,
    url: `${SITE_URL}/issuers/${issuer.slug}`,
    ...(issuer.logo_url ? { logo: issuer.logo_url } : {}),
    ...(issuer.website_url ? { sameAs: [issuer.website_url] } : {}),
    description: issuer.intro
      ? issuer.intro.replace(/\s+/g, ' ').trim().slice(0, 300)
      : `${issuer.name} — credit card lineup and transfer partners.`,
  }

  return (
    <article className="rg-major-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="rg-container">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <header style={{ marginBottom: '2.5rem' }}>
          <p className="font-ui text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]" style={{ marginBottom: '0.5rem' }}>
            Card issuer
          </p>
          <h1
            className="font-display text-[var(--color-primary)]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1, margin: 0 }}
          >
            {issuer.name}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {issuer.website_url && (
              <a href={issuer.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                {issuer.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
              </a>
            )}
            {issuerCurrency && (
              <span>
                Flexible currency:{' '}
                <Link href={`/programs/${issuerCurrency.slug}`} style={{ color: 'var(--color-primary)' }}>
                  {issuerCurrency.name}
                </Link>
              </span>
            )}
            <span>{cards.length} active cards</span>
          </div>
        </header>

        {/* ── Intro ─────────────────────────────────────────────────── */}
        {issuer.intro ? (
          <section style={{ marginBottom: '3rem', maxWidth: '50rem' }}>
            <div className="rg-prose" style={{ whiteSpace: 'pre-wrap' }}>
              {issuer.intro}
            </div>
          </section>
        ) : (
          <section style={{ marginBottom: '3rem', maxWidth: '50rem' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              {issuer.name} reference page is being built out. Card lineup below is current.
            </p>
          </section>
        )}

        {/* ── Active alerts ─────────────────────────────────────────── */}
        {activeAlerts.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 className="font-display text-[var(--color-primary)]" style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
              Active alerts
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeAlerts.map((a) => (
                <li key={a.slug} style={{ padding: '1rem', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', background: 'var(--color-background-soft)' }}>
                  <Link href={`/alerts/${a.slug}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    {a.title}
                  </Link>
                  {a.summary && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
                      {a.summary}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Flexible-currency cards ───────────────────────────────── */}
        {flexibleCards.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 className="font-display text-[var(--color-primary)]" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              {issuerCurrency ? `Cards that earn ${issuerCurrency.name}` : `${issuer.name} cards`}
            </h2>
            {issuerCurrency && (
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                Points pool into{' '}
                <Link href={`/programs/${issuerCurrency.slug}`} style={{ color: 'var(--color-primary)' }}>
                  {issuerCurrency.name}
                </Link>{' '}
                — transferable to airline + hotel partners.
              </p>
            )}
            <CardGrid cards={flexibleCards} />
          </section>
        )}

        {/* ── Co-brand cards, grouped by partner ────────────────────── */}
        {cobrandSorted.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h2 className="font-display text-[var(--color-primary)]" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              Co-brand cards {issuer.name} issues
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              These earn the partner&rsquo;s points directly &mdash; not {issuer.name}&rsquo;s flexible currency.
            </p>
            {cobrandSorted.map(({ partner, cards: partnerCards }) => (
              <div key={partner.id} style={{ marginBottom: '2rem' }}>
                <h3 className="font-display" style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
                  <Link href={`/programs/${partner.slug}`} style={{ color: 'var(--color-text-primary)' }}>
                    {partner.name}
                  </Link>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                    ({partnerCards.length} card{partnerCards.length === 1 ? '' : 's'})
                  </span>
                </h3>
                <CardGrid cards={partnerCards} />
              </div>
            ))}
          </section>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {cards.length === 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No active cards for this issuer yet.
            </p>
          </section>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        {issuer.last_verified && (
          <footer style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border-soft)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Last reviewed {formatLastVerified(issuer.last_verified)}
          </footer>
        )}
      </div>
    </article>
  )
}

/** Compact card listing — name, AF, tier, link to detail. */
function CardGrid({ cards }: { cards: CardRow[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(20rem, 100%), 1fr))',
        gap: '0.75rem',
      }}
    >
      {cards.map((c) => (
        <li key={c.id}>
          <Link
            href={`/cards/${c.slug}`}
            style={{
              display: 'block',
              padding: '1rem 1.25rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--color-background)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              {c.name}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              {[formatAF(c.annual_fee_usd), c.card_type === 'business' ? 'Business' : null]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
