import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import type { AlertWithPrograms } from '@/utils/supabase/queries'
import { selectAlertViewFromVariants, type AlertViewWithPrograms } from '@/utils/content/alertView'
import { isAlertActiveET } from '@/lib/alerts/expiry'
import AlertsGridSB from '@/components/alerts/AlertsGridSB'

// Daily brief; cron rebuilds once/day, no need to revalidate often.
export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Daily Brief',
  description: "Today's top travel rewards alerts, scored and ranked.",
}

function byScore(a: AlertViewWithPrograms, b: AlertViewWithPrograms): number {
  return (
    (b.impact_score + b.value_score + b.rarity_score) -
    (a.impact_score + a.value_score + a.rarity_score)
  )
}

export default async function DailyBriefPage() {
  const supabase = createAdminClient()
  // Phase 3 Wave 2 flip #7: read from content_variants + topics via the
  // AlertView adapter. withPrograms reconstructs the alert_programs shape
  // AlertsGridSB consumes. ET-based active filter applied client-side
  // to match legacy getActiveAlerts semantics exactly.
  const allPublished = await selectAlertViewFromVariants(supabase, { status: 'published', withPrograms: true }) as AlertViewWithPrograms[]
  const allAlerts = allPublished.filter((a) => isAlertActiveET(a.end_date))

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

        {/* Today's alerts only. The cumulative "Still Active" section was
            removed 2026-05-21 — the page is called Daily Brief, so it should
            actually be daily. Readers wanting the full list have the "View
            All Alerts" link in the header. */}
        <div>
          {newToday.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-text-secondary)]">
              No new alerts today — check back later, or{' '}
              <Link href="/alerts" className="text-[var(--color-primary)] underline hover:text-[var(--color-accent)]">
                view all active alerts
              </Link>
              .
            </p>
          ) : (
            <AlertsGridSB alerts={newToday} />
          )}
        </div>

      </div>
    </section>
  )
}
