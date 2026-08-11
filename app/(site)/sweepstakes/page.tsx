import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import SweepstakesBrowser, { type SweepRow } from '@/components/sweepstakes/SweepstakesBrowser'

// Live sweepstakes change at most once a day (the watcher cron runs at 14:00 UTC).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Points & Miles Sweepstakes to Enter | Crazy4Points',
  description:
    'Points and miles sweepstakes worth entering right now — airline miles, hotel points, and once-in-a-lifetime giveaways. Free to enter.',
  alternates: { canonical: '/sweepstakes' },
}

export default async function SweepstakesPage() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('sweepstakes')
    .select('id, program, title, prize, entry_url, source_url, mechanic, ends_at, first_seen')
    .eq('status', 'running')
    // Hide anything already past its enter-by date the instant it expires — the
    // watcher only flips status to 'ended' on its daily run, so without this a
    // just-expired sweep would linger here for hours. Undated ones stay.
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order('ends_at', { ascending: true, nullsFirst: false })
    .order('first_seen', { ascending: false })
  const sweeps = (data ?? []) as SweepRow[]

  return (
    <div className="rg-container rg-major-section">
      <header className="max-w-3xl">
        <p className="font-ui text-xs uppercase tracking-[0.12em] text-[var(--color-accent)] font-bold mb-2">
          Free to enter
        </p>
        <h1 className="mb-3">Points &amp; Miles Sweepstakes</h1>
        <p className="font-body text-lg text-[var(--color-text-secondary)] leading-relaxed">
          Airline miles, hotel points, and money-can&rsquo;t-buy experiences you can win just by entering.
          We track them so you don&rsquo;t have to.
        </p>
      </header>

      {sweeps.length === 0 ? (
        <p className="font-body text-[var(--color-text-secondary)] mt-10">
          No sweepstakes are live at the moment. Check back soon, we refresh this regularly.
        </p>
      ) : (
        <SweepstakesBrowser sweeps={sweeps} />
      )}

      <p className="font-body text-sm text-[var(--color-text-secondary)] mt-10 max-w-3xl">
        Crazy4Points is not the sponsor or administrator of these sweepstakes and does not run them or award
        prizes. No purchase is necessary to enter. Eligibility, entry rules, and deadlines are set by the
        sponsor and can change; some are void where prohibited. Always read the sponsor&apos;s official rules on
        the entry page before entering.
      </p>
    </div>
  )
}
