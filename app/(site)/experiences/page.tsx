import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getExperiences } from '@/utils/supabase/queries'
import { buildMarqueeSections, type MarqueeListing } from '@/lib/experiences/marquee'
import FeaturedGallery from '@/components/experiences/FeaturedGallery'
import ExperienceFinder, { type FinderListing } from '@/components/experiences/ExperienceFinder'
import ExperiencesDirectory from '@/components/experiences/ExperiencesDirectory'

// Curated marquee + full finder + program directory. Listings refresh daily.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Experiences — Redeem Points & Miles for Unforgettable Moments | Crazy4Points',
  description:
    'The dreamiest experiences you can book with points and miles — private airplane tours, Michelin chef tables, adventure cruises, wellness retreats, and money-can\'t-buy access, plus every program that offers them.',
}

// Quick category pills shown at the top of the page — they deep-link into the
// browse finder pre-filtered, so a reader can jump straight to "Music" etc.
// without scrolling past the featured hero. Colors match the finder's pills.
const TOP_CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: 'music', label: 'Music', color: '#B03D77' },
  { key: 'sports', label: 'Sports', color: '#2E7D5B' },
  { key: 'dining', label: 'Culinary', color: '#B8901F' },
  { key: 'travel', label: 'Travel', color: '#17868A' },
  { key: 'misc', label: 'Misc', color: '#6E6486' },
]

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const sp = await searchParams
  const activeCat = TOP_CATEGORIES.find((c) => c.key === sp.category)?.key
  const supabase = createAdminClient()
  const experiences = await getExperiences(supabase)

  // Card -> reachable experience-program slugs ("what my points can get me"), and
  // active transfer bonuses keyed by destination program (our differentiator).
  const { data: cardRows } = await supabase
    .from('programs')
    .select('slug, transfer_partners_outbound')
    .in('slug', ['amex', 'chase', 'citi', 'capital-one', 'bilt'])
  const CARD_NAMES: Record<string, string> = {
    amex: 'Amex', chase: 'Chase', citi: 'Citi', 'capital-one': 'Capital One', bilt: 'Bilt',
  }
  const todayStr = new Date().toISOString().slice(0, 10)
  const cardReach: Record<string, string[]> = {}
  const activeBonuses: Record<string, { card: string; pct: number | null; end: string | null; slug: string | null }[]> = {}
  for (const c of cardRows ?? []) {
    const dests = new Set<string>()
    for (const p of ((c.transfer_partners_outbound as {
      from_slug?: string; bonus_active?: boolean; bonus_end_date?: string; bonus_pct?: number; bonus_alert_slug?: string
    }[] | null) ?? [])) {
      if (p?.from_slug) dests.add(p.from_slug)
      if (p?.bonus_active && p?.from_slug && p?.bonus_end_date && p.bonus_end_date >= todayStr) {
        ;(activeBonuses[p.from_slug] ??= []).push({
          card: CARD_NAMES[c.slug as string] ?? (c.slug as string),
          pct: p.bonus_pct ?? null, end: p.bonus_end_date ?? null, slug: p.bonus_alert_slug ?? null,
        })
      }
    }
    cardReach[c.slug as string] = [...dests]
  }
  const bestBonus: Record<string, { card: string; pct: number | null; end: string | null; slug: string | null }> = {}
  for (const [prog, list] of Object.entries(activeBonuses)) {
    bestBonus[prog] = [...list].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0]
  }

  // Program label + official URL come from the directory rows (program != host).
  const progInfo = new Map(
    experiences
      .filter((e) => e.parent_program_slug)
      .map((e) => [e.parent_program_slug as string, { label: e.parent_program_label, url: e.official_url }]),
  )

  // Hide listings whose booking window has closed (close_date is a cutoff instant).
  const nowIso = new Date().toISOString()
  const { data: rows } = await supabase
    .from('experience_listings')
    .select(
      'id, title, category, location, format, program_slug, source_platform, points_required, current_bid, minimum_bid, event_date, close_date, close_date_confidence, bid_opens_at, detail_url, image_url, featured, first_seen_at, last_seen_at, sold_out',
    )
    .eq('status', 'active')
    .or(`close_date.is.null,close_date.gte.${nowIso}`)
    .order('first_seen_at', { ascending: false })
    .limit(600)

  const all = (rows ?? []) as (MarqueeListing & Record<string, unknown>)[]
  const { us, intl, points, presales } = buildMarqueeSections(all)

  // The finder is the full browse-all catalog: every real experience (points +
  // access presales), searchable. This is where nothing gets lost.
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
    <main>
      {/* Hero — compact: a tight headline + one-line intro so the filters and the
          experiences are reachable without a screenful of scrolling. (The full
          availability disclaimer lives once at the page foot.) */}
      <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)]">
        <div className="rg-container py-7 md:py-9">
          <div className="flex max-w-3xl flex-col gap-2">
            <p className="font-ui text-xs uppercase tracking-widest text-[var(--color-accent)]">Experiences</p>
            <h1 className="font-display text-3xl leading-tight text-[var(--color-primary)] md:text-4xl">
              Your points are a passport to the unforgettable.
            </h1>
            <p className="font-body text-[var(--color-text-secondary)] md:text-lg">
              Michelin chef&apos;s tables, adventure cruises, VIP festival access, a temple blessing in Bali &mdash;
              the dreamiest experiences you can book with points and miles right now.
            </p>
            {/* Colorful quick-category pills — jump straight to filtered results. */}
            <div className="mt-1 flex flex-wrap gap-2">
              {TOP_CATEGORIES.map((c) => {
                const on = activeCat === c.key
                return (
                  <a
                    key={c.key}
                    href={on ? '/experiences#browse' : `/experiences?category=${c.key}#browse`}
                    className="rg-tap-target inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 font-ui text-sm font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                    style={
                      on
                        ? { background: c.color, borderColor: c.color, color: '#fff', boxShadow: `0 6px 16px -3px ${c.color}80` }
                        : { background: `${c.color}14`, borderColor: `${c.color}80`, color: c.color }
                    }
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: on ? '#fff' : c.color }} aria-hidden />
                    {c.label}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="rg-container">
        {/* Quick-jump nav. "Browse & filter" is the emphasized (filled) pill so it
            reads as THE way to filter, not just another anchor. */}
        <nav aria-label="Jump to a section" className="flex flex-wrap items-center gap-2 pb-3 pt-4">
          {(us.length > 0 || intl.length > 0) && <JumpPill href="#featured" label="Featured" />}
          <JumpPill href="#browse" label="Browse &amp; filter" emphasis icon="filter" />
          <JumpPill href="#programs" label="Programs" />
        </nav>

        {/* Featured — one gallery, U.S. / Beyond toggle (was two stacked sections) */}
        {(us.length > 0 || intl.length > 0) && (
          <section id="featured" className="scroll-mt-24 pb-10 pt-2">
            <SectionHead title="Featured right now" count={us.length + intl.length} />
            <FeaturedGallery us={us} intl={intl} />
          </section>
        )}

        {/* Browse all — the full catalog (points experiences + presales), filterable */}
        {finderListings.length > 0 && (
          <section id="browse" className="rg-sub-section scroll-mt-24">
            <SectionHead title="Browse every experience" count={finderListings.length} />
            <p className="mb-5 max-w-2xl font-body text-sm text-[var(--color-text-secondary)]">
              Every experience we&apos;re tracking, from points redemptions and auctions to cardholder
              presales. Filter by program, category, or what your card&apos;s points can reach.
            </p>
            <ExperienceFinder
              listings={finderListings}
              cardReach={cardReach}
              bestBonus={bestBonus}
              initialCats={activeCat ? [activeCat] : undefined}
            />
          </section>
        )}

        {/* Directory footer — the quiet "how to access them all" */}
        <section id="programs" className="rg-sub-section scroll-mt-24">
          <SectionHead title="Every program & how it works" />
          <p className="mb-6 max-w-2xl font-body text-sm text-[var(--color-text-secondary)]">
            The full list of programs that trade points, miles, or cardholder status for experiences, split
            into redeem-your-points programs and cardholder access &amp; presales.
          </p>
          <ExperiencesDirectory experiences={experiences} />
        </section>

        <p className="mb-16 max-w-3xl font-body text-sm text-[var(--color-text-secondary)]">
          Crazy4Points is not affiliated with these experience providers and does not sell, book, or guarantee
          any experience. Availability, point costs, and pricing are set by the provider and change often.
          Confirm all details with the provider before booking or transferring points.
        </p>
      </div>
    </main>
  )
}

function JumpPill({ href, label, emphasis, icon }: { href: string; label: string; emphasis?: boolean; icon?: 'filter' }) {
  return (
    <a
      href={href}
      className={
        'rg-tap-target inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 font-ui text-sm font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ' +
        (emphasis
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
          : 'border-[var(--color-border-soft)] bg-[var(--color-background)] text-[var(--color-primary)] hover:border-[var(--color-primary)]')
      }
    >
      {icon === 'filter' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        </svg>
      )}
      {label}
    </a>
  )
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-6 flex items-baseline gap-3 border-b border-[var(--color-border-soft)] pb-2">
      <h2 className="font-display text-2xl text-[var(--color-primary)] md:text-3xl">{title}</h2>
      {count != null && <span className="font-ui text-sm text-[var(--color-text-secondary)]">{count}</span>}
    </div>
  )
}
