import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getAlertsByPublishDate } from '@/utils/supabase/queries'
import AlertsGridSB from '@/components/alerts/AlertsGridSB'

export const revalidate = 60

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function formatDate(dateStr: string): string {
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

  if (!DATE_REGEX.test(dateStr)) notFound()
  if (new Date(dateStr).toString() === 'Invalid Date') notFound()

  const supabase = await createClient()
  const alerts = await getAlertsByPublishDate(supabase, dateStr)
  const dateLabel = formatDate(dateStr)

  return (
    <section className="rg-major-section !pt-8">
      <div className="rg-container">

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

        {alerts.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-text-secondary)]">
            No alerts were published on this date.
          </p>
        ) : (
          <AlertsGridSB alerts={alerts} />
        )}

      </div>
    </section>
  )
}
