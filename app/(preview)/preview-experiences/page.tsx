import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getExperiences } from '@/utils/supabase/queries'
import { buildMarqueeSections, type MarqueeListing } from '@/lib/experiences/marquee'
import FeaturedGallery from '@/components/experiences/FeaturedGallery'
import ExperienceFinder, { type FinderListing } from '@/components/experiences/ExperienceFinder'
import ExperiencesDirectory from '@/components/experiences/ExperiencesDirectory'
import FullBleedBanner from '@/components/preview/FullBleedBanner'
import LuxeHeader from '@/components/layout/LuxeHeader'

// Luxury redesign of /experiences (Jill, 2026-09-06) — preview only, live page
// untouched. Leads with the VIP Experiences framed banner, then the real
// featured gallery / finder / directory dressed in the Royal Glow luxe style.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Experiences (luxe preview) | Crazy4Points',
  robots: { index: false },
}

const TOP_CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: 'music', label: 'Music', color: '#B03D77' },
  { key: 'sports', label: 'Sports', color: '#2E7D5B' },
  { key: 'dining', label: 'Culinary', color: '#B8901F' },
  { key: 'travel', label: 'Travel', color: '#17868A' },
  { key: 'misc', label: 'Misc', color: '#6E6486' },
]

export default async function PreviewExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const sp = await searchParams
  const activeCat = TOP_CATEGORIES.find((c) => c.key === sp.category)?.key
  const supabase = createAdminClient()
  const experiences = await getExperiences(supabase)

  const { data: cardRows } = await supabase
    .from('programs')
    .select('slug, transfer_partners_outbound')
    .in('slug', ['amex', 'chase', 'citi', 'capital-one', 'bilt'])
  const CARD_NAMES: Record<string, string> = { amex: 'Amex', chase: 'Chase', citi: 'Citi', 'capital-one': 'Capital One', bilt: 'Bilt' }
  const todayStr = new Date().toISOString().slice(0, 10)
  const cardReach: Record<string, string[]> = {}
  const activeBonuses: Record<string, { card: string; pct: number | null; end: string | null; slug: string | null }[]> = {}
  for (const c of cardRows ?? []) {
    const dests = new Set<string>()
    for (const p of ((c.transfer_partners_outbound as { from_slug?: string; bonus_active?: boolean; bonus_end_date?: string; bonus_pct?: number; bonus_alert_slug?: string }[] | null) ?? [])) {
      if (p?.from_slug) dests.add(p.from_slug)
      if (p?.bonus_active && p?.from_slug && p?.bonus_end_date && p.bonus_end_date >= todayStr) {
        ;(activeBonuses[p.from_slug] ??= []).push({ card: CARD_NAMES[c.slug as string] ?? (c.slug as string), pct: p.bonus_pct ?? null, end: p.bonus_end_date ?? null, slug: p.bonus_alert_slug ?? null })
      }
    }
    cardReach[c.slug as string] = [...dests]
  }
  const bestBonus: Record<string, { card: string; pct: number | null; end: string | null; slug: string | null }> = {}
  for (const [prog, list] of Object.entries(activeBonuses)) {
    bestBonus[prog] = [...list].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0]
  }

  const progInfo = new Map(
    experiences.filter((e) => e.parent_program_slug).map((e) => [e.parent_program_slug as string, { label: e.parent_program_label, url: e.official_url }]),
  )

  const nowIso = new Date().toISOString()
  const { data: rows } = await supabase
    .from('experience_listings')
    .select('id, title, category, location, format, program_slug, source_platform, points_required, current_bid, minimum_bid, event_date, close_date, close_date_confidence, bid_opens_at, detail_url, image_url, featured, first_seen_at, last_seen_at, sold_out')
    .eq('status', 'active')
    .or(`close_date.is.null,close_date.gte.${nowIso}`)
    .order('first_seen_at', { ascending: false })
    .limit(600)

  const all = (rows ?? []) as (MarqueeListing & Record<string, unknown>)[]
  const { us, intl, points, presales } = buildMarqueeSections(all)

  const toFinder = (l: (typeof all)[number]): FinderListing => {
    const info = progInfo.get(l.program_slug as string)
    return {
      program_slug: l.program_slug as string,
      program_label: info?.label ?? (l.source_platform as string) ?? (l.program_slug as string),
      program_url: info?.url ?? null,
      title: l.title as string,
      category: (l.category as string) ?? null,
      location: (l.location as string) ?? null,
      format: (l.format as string) ?? null,
      current_bid: (l.current_bid as number) ?? null,
      points_required: (l.points_required as number) ?? null,
      close_date: (l.close_date as string) ?? null,
      close_date_confidence: (l.close_date_confidence as string) ?? null,
      event_date: (l.event_date as string) ?? null,
      bid_opens_at: (l.bid_opens_at as string) ?? null,
      detail_url: (l.detail_url as string) ?? null,
      image_url: (l.image_url as string) ?? null,
      first_seen_at: (l.first_seen_at as string) ?? null,
      last_seen_at: (l.last_seen_at as string) ?? null,
      sold_out: (l.sold_out as boolean) ?? false,
    }
  }
  const finderListings: FinderListing[] = [...points, ...presales].map(toFinder)

  return (
    <>
      <LuxeHeader />
      {/* Real h1 for SEO + screen readers (the visible title is the banner art). */}
      <h1 className="sr-only">Experiences: redeem points and miles for unforgettable moments</h1>
      {/* ===== Luxury hero — full-bleed VIP Experiences band (gold top/bottom only) ===== */}
      <section style={{ background: 'radial-gradient(120% 90% at 50% -10%, #f3ecfa 0%, var(--color-background) 60%)' }}>
        {/* Full page width, gold edges only on top + bottom, no side borders. */}
        <FullBleedBanner image="/hero-preview/cards/experiences-banner.png" alt="VIP Experiences — book with points" />
        <div className="rg-container" style={{ paddingTop: '2rem', paddingBottom: '2.75rem' }}>
          <p className="mx-auto max-w-2xl text-center font-body text-[var(--color-text-secondary)] md:text-lg">
            Michelin chef&apos;s tables, front-row seats, suites at the game, a temple blessing in Bali &mdash; the
            money-can&apos;t-buy moments your points and miles unlock right now.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {TOP_CATEGORIES.map((c) => {
              const on = activeCat === c.key
              return (
                <a
                  key={c.key}
                  href={on ? '/preview-experiences#browse' : `/preview-experiences?category=${c.key}#browse`}
                  className="rg-tap-target inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 font-ui text-sm font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                  style={on ? { background: c.color, borderColor: c.color, color: '#fff', boxShadow: `0 6px 16px -3px ${c.color}80` } : { background: `${c.color}14`, borderColor: `${c.color}80`, color: c.color }}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: on ? '#fff' : c.color }} aria-hidden />
                  {c.label}
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <div className="rg-container">
        {/* Quick-jump nav (parity with the old page) */}
        <nav aria-label="Jump to a section" className="flex flex-wrap items-center gap-2 pt-5">
          {(us.length > 0 || intl.length > 0) && <JumpPill href="#featured" label="Featured" />}
          <JumpPill href="#browse" label="Browse &amp; filter" emphasis />
          <JumpPill href="#programs" label="Programs" />
        </nav>
        {(us.length > 0 || intl.length > 0) && (
          <section id="featured" className="scroll-mt-24 pb-10 pt-9">
            <LuxeHead title="Featured right now" count={us.length + intl.length} />
            <FeaturedGallery us={us} intl={intl} />
          </section>
        )}

        {finderListings.length > 0 && (
          <section id="browse" className="rg-sub-section scroll-mt-24">
            <LuxeHead title="Browse every experience" count={finderListings.length} />
            <p className="mb-5 max-w-2xl font-body text-sm text-[var(--color-text-secondary)]">
              Every experience we&apos;re tracking, from points redemptions and auctions to cardholder presales.
              Filter by program, category, or what your card&apos;s points can reach.
            </p>
            <ExperienceFinder listings={finderListings} cardReach={cardReach} bestBonus={bestBonus} initialCats={activeCat ? [activeCat] : undefined} luxe />
          </section>
        )}

        <section id="programs" className="rg-sub-section scroll-mt-24">
          <LuxeHead title="Every program & how it works" />
          <p className="mb-6 max-w-2xl font-body text-sm text-[var(--color-text-secondary)]">
            The full list of programs that trade points, miles, or cardholder status for experiences, split into
            redeem-your-points programs and cardholder access &amp; presales.
          </p>
          <ExperiencesDirectory experiences={experiences} />
        </section>

        <p className="mb-16 max-w-3xl font-body text-sm text-[var(--color-text-secondary)]">
          Crazy4Points is not affiliated with these experience providers and does not sell, book, or guarantee any
          experience. Availability, point costs, and pricing are set by the provider and change often. Confirm all
          details with the provider before booking or transferring points.
        </p>
      </div>
    </>
  )
}

// Quick-jump pill to a page section (gold = the emphasized "Browse & filter").
function JumpPill({ href, label, emphasis }: { href: string; label: string; emphasis?: boolean }) {
  return (
    <a
      href={href}
      className="rg-tap-target inline-flex items-center rounded-full px-4 py-2 font-ui text-sm font-bold transition-all duration-150 hover:-translate-y-0.5"
      style={
        emphasis
          ? { background: 'linear-gradient(180deg,#f8e7a8,#ebcc66 55%,#cfa63f)', border: '1.5px solid #b8862a', color: '#3E1A57', boxShadow: '0 5px 12px -6px rgba(201,161,58,0.8)' }
          : { background: '#fff', border: '1.5px solid rgba(107,45,143,0.25)', color: 'var(--color-primary)' }
      }
    >
      {label}
    </a>
  )
}

// Luxe section header — gold rule eyebrow + serif title, matching the homepage.
function LuxeHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-6">
      <div className="h-[2px] w-8 rounded" style={{ background: 'var(--color-accent)' }} />
      <div className="mt-2 flex items-baseline gap-3">
        <h2 className="font-display text-2xl font-bold text-[var(--color-primary)] md:text-3xl">{title}</h2>
        {count != null && <span className="font-ui text-sm text-[var(--color-text-secondary)]">{count}</span>}
      </div>
    </div>
  )
}
