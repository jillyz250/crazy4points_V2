import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanityClient'
import { getActiveAlerts, getAlertsByDate } from '@/lib/queries'
import type { SanityAlert } from '@/lib/types'
import { computeFinalScore } from '@/lib/scoring'
import AlertsGrid from '@/components/alerts/AlertsGrid'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Daily Brief — crazy4points',
  description: "Today's top travel rewards alerts, scored and ranked.",
}

type ScoredAlert = SanityAlert & { finalScore: number }

function withScores(alerts: SanityAlert[]): ScoredAlert[] {
  return alerts.map((a) => ({ ...a, finalScore: computeFinalScore(a) }))
}

export default async function DailyBriefPage() {
  const today     = new Date().toISOString().slice(0, 10)
  const dateStart = `${today}T00:00:00.000Z`
  const dateEnd   = `${today}T23:59:59.999Z`

  const [activeAlerts, todayAlerts] = await Promise.all([
    sanityFetch<SanityAlert[]>(getActiveAlerts),
    sanityFetch<SanityAlert[]>(getAlertsByDate, { dateStart, dateEnd }),
  ])

  const todayIds = new Set(todayAlerts.map((a) => a._id))

  const newToday: ScoredAlert[] = withScores(todayAlerts).sort(
    (a, b) => b.finalScore - a.finalScore
  )

  const stillActive: ScoredAlert[] = withScores(
    activeAlerts.filter((a) => !todayIds.has(a._id))
  ).sort((a, b) => b.finalScore - a.finalScore)

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
            <AlertsGrid alerts={newToday} />
          )}
        </div>

        {/* Section 2 — Still Active */}
        <div>
          <h2 className="mb-6 font-display text-2xl font-semibold">Still Active</h2>
          <AlertsGrid alerts={stillActive} />
        </div>

      </div>
    </section>
  )
}
