import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getExperiences } from '@/utils/supabase/queries'
import ExperiencesDirectory from '@/components/experiences/ExperiencesDirectory'
import ExperienceFinder, { type FinderListing } from '@/components/experiences/ExperienceFinder'

// Directory of experience programs; changes only when we add/edit a program.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Experiences — Redeem Points & Cardholder Access | Crazy4Points',
  description:
    'Every major program that lets you redeem points or miles for experiences, or unlocks cardholder presales and access — concerts, sports, dining, and money-can\'t-buy moments.',
}

export default async function ExperiencesPage() {
  const supabase = createAdminClient()
  const experiences = await getExperiences(supabase)

  // Live listings for the interactive finder. Program label + official URL come
  // from the directory rows (program != host platform).
  const progInfo = new Map(
    experiences
      .filter((e) => e.parent_program_slug)
      .map((e) => [e.parent_program_slug as string, { label: e.parent_program_label, url: e.official_url }]),
  )
  const { data: rawListings } = await supabase
    .from('experience_listings')
    .select('program_slug, source_platform, title, category, location, format, current_bid, points_required, close_date, close_date_confidence, event_date, bid_opens_at, detail_url, first_seen_at')
    .eq('status', 'active')
    .order('first_seen_at', { ascending: false })
    .limit(600)
  const listings: FinderListing[] = (rawListings ?? []).map((l) => {
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
    }
  })

  return (
    <main className="rg-container rg-major-section">
      <header className="mb-10 max-w-3xl">
        <h1 className="mb-4 font-display text-4xl text-[var(--color-primary)] md:text-5xl">Experiences</h1>
        <p className="font-body text-lg text-[var(--color-text-primary)]">
          Points and miles aren&apos;t just for flights and hotel nights. Loyalty programs and card
          issuers will trade them — or your cardholder status — for concerts, sporting events, chef
          tables, festival access, and genuinely money-can&apos;t-buy moments. Many even let you pay
          with cash instead, your choice.
        </p>
        <p className="mt-3 font-body text-[var(--color-text-secondary)]">
          Here&apos;s every major platform worth knowing, split into <strong>redeem-your-points</strong>{' '}
          programs and <strong>cardholder access &amp; presales</strong>. Filter and sort to find the one
          that fits what you carry.
        </p>
      </header>

      {listings.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-border-soft)] pb-2">
            <h2 className="font-display text-2xl text-[var(--color-primary)]">Browse live experiences</h2>
            <span className="font-ui text-xs text-[var(--color-text-secondary)]">
              Pick a program, search, and sort. Bidding and details are on the official site.
            </span>
          </div>
          <ExperienceFinder listings={listings} />
          <p className="mt-4 font-body text-sm text-[var(--color-text-secondary)]">
            A snapshot of what we&apos;re tracking, refreshed daily. Larger programs list more on their
            official sites, and inventory changes constantly, so always confirm what&apos;s bookable
            there before you plan or transfer points.
          </p>
        </section>
      )}

      <div className="mb-4 border-b border-[var(--color-border-soft)] pb-2">
        <h2 className="font-display text-2xl text-[var(--color-primary)]">All programs &amp; how they work</h2>
      </div>
      <ExperiencesDirectory experiences={experiences} />
    </main>
  )
}
