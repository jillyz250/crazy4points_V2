import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getExperiences } from '@/utils/supabase/queries'
import { buildMarqueeSections, type MarqueeListing } from '@/lib/experiences/marquee'
import ExperienceCard from '@/components/experiences/ExperienceCard'
import ExperienceFinder, { type FinderListing } from '@/components/experiences/ExperienceFinder'
import ExperiencesDirectory from '@/components/experiences/ExperiencesDirectory'

// Curated marquee + full finder + program directory. Listings refresh daily.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Experiences — Redeem Points & Miles for Unforgettable Moments | Crazy4Points',
  description:
    'The dreamiest experiences you can book with points and miles — private airplane tours, Michelin chef tables, adventure cruises, wellness retreats, and money-can\'t-buy access, plus every program that offers them.',
}

export default async function ExperiencesPage() {
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
      'id, title, category, location, format, program_slug, source_platform, points_required, current_bid, minimum_bid, event_date, close_date, close_date_confidence, bid_opens_at, detail_url, image_url, first_seen_at, last_seen_at, sold_out',
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
      first_seen_at: (l.first_seen_at as string) ?? null,
      last_seen_at: (l.last_seen_at as string) ?? null,
      sold_out: (l.sold_out as boolean) ?? false,
    }
  }
  const finderListings: FinderListing[] = [...points, ...presales].map(toFinder)

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)]">
        <div className="rg-container py-16 md:py-20">
          {/* flex `gap` (not margins) so spacing survives the global h1/p margin
              reset that silently kills margin utilities on headings/paragraphs */}
          <div className="flex max-w-2xl flex-col gap-10 md:gap-12">
            <div className="flex flex-col gap-3">
              <p className="font-ui text-sm uppercase tracking-widest text-[var(--color-accent)]">Experiences</p>
              <h1 className="font-display text-4xl leading-tight text-[var(--color-primary)] md:text-5xl">
                Your points are a passport to the unforgettable.
              </h1>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-body text-lg text-[var(--color-text-primary)]">
                Not just flights and hotel nights. A private airplane tour over Monument Valley, a chef&apos;s
                counter at a Michelin table, an adventure cruise through Costa Rica, a temple blessing in Bali.
                Here are the dreamiest experiences you can book with points and miles right now.
              </p>
              <p className="font-body text-sm text-[var(--color-text-secondary)]">
                Prices and availability are set by each program and change often. Always confirm on the official
                site before you plan or transfer points.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="rg-container">
        {/* Quick-jump nav so the non-U.S. block (and the rest) are reachable without
            scrolling past the long U.S. gallery. */}
        <nav aria-label="Jump to a section" className="flex flex-wrap gap-2 py-6">
          {us.length > 0 && <JumpPill href="#in-the-us" label="In the U.S." />}
          {intl.length > 0 && <JumpPill href="#beyond-us" label="Beyond the U.S." />}
          <JumpPill href="#browse" label="Browse all" />
          <JumpPill href="#programs" label="Programs" />
        </nav>

        {/* Featured — U.S. */}
        {us.length > 0 && (
          <section id="in-the-us" className="rg-sub-section scroll-mt-24">
            <SectionHead title="Featured in the U.S." count={us.length} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {us.map((g) => (
                <ExperienceCard key={g.key} group={g} />
              ))}
            </div>
          </section>
        )}

        {/* Featured — non-U.S. */}
        {intl.length > 0 && (
          <section id="beyond-us" className="rg-sub-section scroll-mt-24">
            <SectionHead title="Featured beyond the U.S." count={intl.length} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {intl.map((g) => (
                <ExperienceCard key={g.key} group={g} />
              ))}
            </div>
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
            <ExperienceFinder listings={finderListings} cardReach={cardReach} bestBonus={bestBonus} />
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

function JumpPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="rg-tap-target inline-flex items-center rounded-full border border-[var(--color-border-soft)] px-4 py-2 font-ui text-sm text-[var(--color-primary)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-background-soft)]"
    >
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
