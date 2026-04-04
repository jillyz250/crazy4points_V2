import { Suspense } from 'react'
import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanityClient'
import { getAlertsByFilter } from '@/lib/queries'
import type { SanityAlert } from '@/lib/types'
import AlertsGrid from '@/components/alerts/AlertsGrid'
import AlertsFilters from '@/components/alerts/AlertsFilters'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Alerts — crazy4points',
  description: 'Live travel rewards alerts — transfer bonuses, limited-time offers, devaluations, and more.',
}

function sortAlerts(alerts: SanityAlert[]): SanityAlert[] {
  const now = new Date()
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const group = (a: SanityAlert): number => {
    const end = a.endDate ? new Date(a.endDate) : null
    const start = a.startDate ? new Date(a.startDate) : null
    if (end && end < now) return 3           // expired
    if (start && start > now) return 2       // upcoming
    if (end && end <= sevenDaysOut) return 0 // expiring soon (active)
    return 1                                 // active
  }

  return [...alerts].sort((a, b) => group(a) - group(b))
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; type?: string }>
}) {
  const { program, type } = await searchParams

  const alerts = await sanityFetch<SanityAlert[]>(getAlertsByFilter, {
    program: program ?? null,
    type: type ?? null,
  })

  const sorted = sortAlerts(alerts)

  return (
    <section className="rg-major-section !pt-8">
      <div className="rg-container">
        <div className="mb-6">
          <h1 className="font-display text-4xl font-bold">Alerts</h1>
          <p className="mt-2 mb-5 font-body text-[var(--color-text-secondary)]">
            Live transfer bonuses, limited-time offers, and program changes — sorted by urgency.
          </p>
        </div>

        {/* AlertsFilters uses useSearchParams — must be wrapped in Suspense */}
        <Suspense fallback={<div className="mb-8 h-10" />}>
          <AlertsFilters program={program ?? null} type={type ?? null} />
        </Suspense>

        <AlertsGrid alerts={sorted} />
      </div>
    </section>
  )
}
