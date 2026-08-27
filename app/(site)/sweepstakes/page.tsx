import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import SweepstakesBrowser, { type SweepRow } from '@/components/sweepstakes/SweepstakesBrowser'
import SweepCard from '@/components/sweepstakes/SweepCard'
import {
  SWEEP_CATEGORY_PILLS,
  isTimeshareSweep,
  sweepCategory,
  sweepScore,
  sweepPrizeValue,
} from '@/lib/sweepstakes/categories'

// Live sweepstakes change at most once a day (the watcher cron runs at 14:00 UTC).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Points & Miles Sweepstakes to Enter | Crazy4Points',
  description:
    'Points and miles sweepstakes worth entering right now — airline miles, hotel points, and once-in-a-lifetime giveaways. Free to enter.',
  alternates: { canonical: '/sweepstakes' },
}

export default async function SweepstakesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const sp = await searchParams
  const activeCat = SWEEP_CATEGORY_PILLS.find((c) => c.key === sp.category)?.key
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('sweepstakes')
    .select('id, program, title, prize, entry_url, source_url, mechanic, ends_at, first_seen, image_url, featured')
    .eq('status', 'running')
    // Hide anything already past its enter-by date the instant it expires — the
    // watcher only flips status to 'ended' on its daily run. Undated ones stay.
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order('ends_at', { ascending: true, nullsFirst: false })
    .order('first_seen', { ascending: false })
  // Keep timeshare / vacation-ownership lead-gen sweeps OFF the public page —
  // their "2M point" prizes are bait for a high-pressure presentation.
  const sweeps = ((data ?? []) as SweepRow[]).filter((s) => !isTimeshareSweep(s.program, s.prize, s.title))
  // Featured = editorial ⭐ picks; when nothing is curated, fall back to the top
  // prizes (biggest points/miles) so the section is never empty or weak.
  const starred = sweeps.filter((s) => s.featured)
  const featured =
    starred.length > 0
      ? starred
      : [...sweeps]
          .sort(
            (a, b) =>
              sweepScore(b.prize, b.title, sweepCategory(b.prize, b.title).key) -
                sweepScore(a.prize, a.title, sweepCategory(a.prize, a.title).key) ||
              sweepPrizeValue(b.prize, b.title) - sweepPrizeValue(a.prize, a.title),
          )
          .slice(0, 3)

  return (
    <div>
      {/* Compact hero + colorful category quick-pills */}
      <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)]">
        <div className="rg-container py-7 md:py-9">
          <div className="flex max-w-3xl flex-col gap-2">
            <p className="font-ui text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-accent)]">Free to enter</p>
            <h1 className="font-display text-3xl leading-tight text-[var(--color-primary)] md:text-4xl">
              Points &amp; Miles Sweepstakes
            </h1>
            <p className="font-body text-[var(--color-text-secondary)] md:text-lg">
              Airline miles, hotel points, and money-can&rsquo;t-buy experiences you can win just by entering. We track
              them so you don&rsquo;t have to.
            </p>
            {sweeps.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {SWEEP_CATEGORY_PILLS.map((c) => {
                  const on = activeCat === c.key
                  return (
                    <a
                      key={c.key}
                      href={on ? '/sweepstakes#browse' : `/sweepstakes?category=${c.key}#browse`}
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
            )}
          </div>
        </div>
      </section>

      <div className="rg-container pb-16">
        {sweeps.length === 0 ? (
          <p className="mt-10 font-body text-[var(--color-text-secondary)]">
            No sweepstakes are live at the moment. Check back soon, we refresh this regularly.
          </p>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="pb-4 pt-8">
                <div className="mb-5 flex items-baseline gap-3 border-b border-[var(--color-border-soft)] pb-2">
                  <h2 className="font-display text-2xl text-[var(--color-primary)] md:text-3xl">Featured giveaways</h2>
                  <span className="font-ui text-sm text-[var(--color-text-secondary)]">{featured.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((s) => (
                    <SweepCard key={s.id} sweep={s} />
                  ))}
                </div>
              </section>
            )}

            <section id="browse" className="scroll-mt-24 pt-6">
              <div className="mb-5 flex items-baseline gap-3 border-b border-[var(--color-border-soft)] pb-2">
                <h2 className="font-display text-2xl text-[var(--color-primary)] md:text-3xl">Browse &amp; filter</h2>
                <span className="font-ui text-sm text-[var(--color-text-secondary)]">{sweeps.length}</span>
              </div>
              <SweepstakesBrowser sweeps={sweeps} initialCats={activeCat ? [activeCat] : undefined} />
            </section>
          </>
        )}

        <p className="mt-10 max-w-3xl font-body text-sm text-[var(--color-text-secondary)]">
          Crazy4Points is not the sponsor or administrator of these sweepstakes and does not run them or award
          prizes. No purchase is necessary to enter. Eligibility, entry rules, and deadlines are set by the sponsor
          and can change; some are void where prohibited. Always read the sponsor&apos;s official rules on the entry
          page before entering.
        </p>
      </div>
    </div>
  )
}
