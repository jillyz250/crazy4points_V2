import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanityClient'
import { getAlertsByDate } from '@/lib/queries'
import type { SanityAlert } from '@/lib/types'
import { computeFinalScore } from '@/lib/scoring'
import AlertsGrid from '@/components/alerts/AlertsGrid'

export const revalidate = 60

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function formatDate(dateStr: string): string {
  // Parse as UTC noon to avoid timezone-shift display issues
  const date = new Date(`${dateStr}T12:00:00.000Z`)
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>
}): Promise<Metadata> {
  const { date } = await params
  if (!DATE_REGEX.test(date) || new Date(date).toString() === 'Invalid Date') {
    return { title: 'Not Found — crazy4points' }
  }
  return {
    title: `Daily Brief — ${formatDate(date)} — crazy4points`,
    description: `Travel rewards alerts published on ${formatDate(date)}.`,
  }
}

export default async function DailyBriefArchivePage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date: dateStr } = await params

  // Validate format
  if (!DATE_REGEX.test(dateStr)) notFound()

  // Validate it's a real calendar date
  if (new Date(dateStr).toString() === 'Invalid Date') notFound()

  const dateStart = `${dateStr}T00:00:00.000Z`
  const dateEnd   = `${dateStr}T23:59:59.999Z`

  const raw = await sanityFetch<SanityAlert[]>(getAlertsByDate, { dateStart, dateEnd })

  const alerts = raw
    .map((a) => ({ ...a, finalScore: computeFinalScore(a) }))
    .sort((a, b) => b.finalScore - a.finalScore)

  const dateLabel = formatDate(dateStr)

  return (
    <section className="rg-major-section !pt-8">
      <div className="rg-container">

        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Link
              href="/daily-brief"
              className="font-ui text-xs font-medium uppercase tracking-[0.1em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
            >
              ← Back to Today
            </Link>
            <span className="text-[var(--color-border-soft)]">|</span>
            <Link
              href="/alerts"
              className="font-ui text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
            >
              View All Alerts →
            </Link>
          </div>

          <h1 className="font-display text-4xl font-bold">
            Daily Brief — {dateLabel}
          </h1>

          <span className="mt-3 inline-block rounded-full border border-[var(--color-border-soft)] px-3 py-1 font-ui text-xs font-medium uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
            Archive — Read Only
          </span>
        </div>

        {/* Alerts */}
        {alerts.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-text-secondary)]">
            No alerts were published on this date.
          </p>
        ) : (
          <AlertsGrid alerts={alerts} />
        )}

      </div>
    </section>
  )
}
