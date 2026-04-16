import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getActiveAlerts } from '@/utils/supabase/queries'
import type { AlertWithPrograms } from '@/utils/supabase/queries'
import AlertsGridSB from '@/components/alerts/AlertsGridSB'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Daily Brief — crazy4points',
  description: "Today's top travel rewards alerts, scored and ranked.",
}

function byScore(a: AlertWithPrograms, b: AlertWithPrograms): number {
  return (
    (b.impact_score + b.value_score + b.rarity_score) -
    (a.impact_score + a.value_score + a.rarity_score)
  )
}

export default async function DailyBriefPage() {
  const supabase = createAdminClient()
  const allAlerts = await getActiveAlerts(supabase)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const newToday = allAlerts
    .filter((a) => a.published_at && new Date(a.published_at) >= todayStart)
    .sort(byScore)

  const todayIds = new Set(newToday.map((a) => a.id))

  const stillActive = allAlerts
    .filter((a) => !todayIds.has(a.id))
    .sort(byScore)

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric',
  })

  return (
    <section className="rg-major-section !pt-8">
      <div className="rg-container">

        {/* Header */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">Daily Brief</h1>
            <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
              {dateLabel}
            </p>
          </div>
          <Link
            href="/alerts"
            className="font-ui text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
          >
            View All Alerts →
          </Link>
        </div>

        {/* Section 1 — New Today */}
        <div className="mb-14">
          <h2 className="mb-6 font-display text-2xl font-semibold">New Today</h2>
          {newToday.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-text-secondary)]">
              No new alerts today — check back later.
            </p>
          ) : (
            <AlertsGridSB alerts={newToday} />
          )}
        </div>

        {/* Section 2 — Still Active */}
        <div>
          <h2 className="mb-6 font-display text-2xl font-semibold">Still Active</h2>
          <AlertsGridSB alerts={stillActive} />
        </div>

      </div>
    </section>
  )
}
