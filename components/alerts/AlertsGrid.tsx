'use client'

import type { SanityAlert } from '@/lib/types'
import AlertCard from './AlertCard'

export default function AlertsGrid({ alerts }: { alerts: SanityAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl text-[var(--color-primary)]">
          No alerts match your filters.
        </p>
        <p className="mt-2 font-body text-sm text-[var(--color-text-secondary)]">
          Try clearing your filters or check back later.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {alerts.map((alert) => (
        <AlertCard key={alert._id} alert={alert} />
      ))}
    </div>
  )
}
