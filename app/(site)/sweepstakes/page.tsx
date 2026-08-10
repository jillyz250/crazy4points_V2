import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'

// Live sweepstakes change at most daily (the watcher cron runs at 14:00 UTC).
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Points & Miles Sweepstakes to Enter | Crazy4Points',
  description:
    'Every points and miles sweepstakes worth entering right now — airline miles, hotel points, and once-in-a-lifetime giveaways. Free to enter, updated daily.',
  alternates: { canonical: '/sweepstakes' },
}

type SweepRow = {
  id: string
  program: string
  title: string
  prize: string | null
  entry_url: string | null
  source_url: string | null
  mechanic: string | null
  ends_at: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function endsLabel(ends: string | null): string | null {
  if (!ends) return null
  const m = ends.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const month = MONTHS[parseInt(m[2], 10) - 1]
  if (!month) return null
  return `Ends ${month} ${parseInt(m[3], 10)}`
}

// A real, followable link: prefer the entry page, fall back to the source page.
// A bare "#" or non-http value is not a link.
function enterHref(row: SweepRow): string | null {
  const entry = (row.entry_url ?? '').trim()
  if (/^https?:\/\//i.test(entry) && !entry.endsWith('#')) return entry
  const source = (row.source_url ?? '').trim()
  if (/^https?:\/\//i.test(source)) return source
  return null
}

function mechanicLabel(m: string | null): string | null {
  if (m === 'daily_entry') return 'Enter daily'
  if (m === 'one_time') return 'One-time entry'
  return null
}

export default async function SweepstakesPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sweepstakes')
    .select('id, program, title, prize, entry_url, source_url, mechanic, ends_at')
    .eq('status', 'running')
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
          We track them daily so you never miss one. {sweeps.length > 0 ? `${sweeps.length} live right now.` : ''}
        </p>
      </header>

      {sweeps.length === 0 ? (
        <p className="font-body text-[var(--color-text-secondary)] mt-10">
          No sweepstakes are live at the moment. Check back soon, we refresh this every day.
        </p>
      ) : (
        <div
          className="mt-10 grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 20rem), 1fr))' }}
        >
          {sweeps.map((s) => {
            const href = enterHref(s)
            const ends = endsLabel(s.ends_at)
            const mech = mechanicLabel(s.mechanic)
            return (
              <div
                key={s.id}
                className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5"
                style={{ boxShadow: 'var(--shadow-soft)' }}
              >
                <p className="font-ui text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--color-primary)] font-bold mb-1.5">
                  {s.program}
                </p>
                <h2 className="font-display text-xl leading-snug text-[var(--color-text-primary)] mb-2">
                  {s.title}
                </h2>
                {s.prize ? (
                  <p className="font-body text-sm text-[var(--color-text-secondary)] mb-3">
                    Win <span className="font-bold text-[var(--color-accent)]">{s.prize}</span>
                  </p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  {ends ? (
                    <span className="inline-block font-ui text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-accent)]/20 rounded-full px-2.5 py-1">
                      {ends}
                    </span>
                  ) : null}
                  {mech ? (
                    <span className="font-ui text-[0.6875rem] uppercase tracking-wide text-[var(--color-text-secondary)]">
                      {mech}
                    </span>
                  ) : null}
                </div>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rg-btn-primary mt-4 text-center"
                  >
                    Enter now
                  </a>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <p className="font-body text-sm text-[var(--color-text-secondary)] mt-10 max-w-3xl">
        Sweepstakes are run by the loyalty programs and their partners, not by Crazy4Points. Always read the
        official rules on the entry page for eligibility, deadlines, and how winners are chosen.
      </p>
    </div>
  )
}
