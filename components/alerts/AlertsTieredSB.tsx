import type { AlertWithPrograms } from '@/utils/supabase/queries'
import { tierAlerts } from '@/lib/alerts/tier'
import AlertHeroCardSB from './AlertHeroCardSB'
import AlertCardSB from './AlertCardSB'
import AlertRowSB from './AlertRowSB'

export default function AlertsTieredSB({ alerts }: { alerts: AlertWithPrograms[] }) {
  if (alerts.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl text-[var(--color-primary)]">No active alerts right now.</p>
        <p className="mt-2 font-body text-sm text-[var(--color-text-secondary)]">Check back soon.</p>
      </div>
    )
  }

  const { hero, grid, condensed } = tierAlerts(alerts)

  return (
    <div className="flex flex-col gap-10">
      {hero.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-[var(--color-primary)]">
            Top Alerts
          </h2>
          <div className={`grid gap-4 ${hero.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
            {hero.map((a) => (
              <AlertHeroCardSB key={a.id} alert={a} />
            ))}
          </div>
        </section>
      )}

      {grid.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-[var(--color-primary)]">
            More Alerts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((a) => (
              <AlertCardSB key={a.id} alert={a} />
            ))}
          </div>
        </section>
      )}

      {condensed.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-[var(--color-primary)]">
            Also Active
          </h2>
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
            {condensed.map((a) => (
              <AlertRowSB key={a.id} alert={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
