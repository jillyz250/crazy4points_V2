import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getPrograms } from '@/utils/supabase/queries'
import { selectAlertViewFromVariants, type AlertViewWithPrograms } from '@/utils/content/alertView'
import { isAlertActiveET } from '@/lib/alerts/expiry'
import AlertsGridSB from '@/components/alerts/AlertsGridSB'
import AlertsTieredSB from '@/components/alerts/AlertsTieredSB'
import AlertsFiltersSB from '@/components/alerts/AlertsFiltersSB'

// Alerts index; new alerts publish throughout the day. 5 min is responsive enough.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Alerts',
  description: 'Live travel rewards alerts — transfer bonuses, limited-time offers, devaluations, and more.',
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; program?: string }>
}) {
  const { type, program: programSlug } = await searchParams
  const supabase = createAdminClient()

  // Phase 3 Wave 2 flip #9: alerts read from content_variants + topics via
  // the AlertView adapter. Type + program filters and ET-active filter all
  // applied client-side after the adapter fetch. Result set is small so
  // client filter cost is nil.
  const [allPublished, programs] = await Promise.all([
    selectAlertViewFromVariants(supabase, { status: 'published', withPrograms: true }) as Promise<AlertViewWithPrograms[]>,
    getPrograms(supabase),
  ])
  const alerts = allPublished.filter((a) => {
    if (!isAlertActiveET(a.end_date)) return false
    if (type && a.type !== type) return false
    if (programSlug && !a.alert_programs.some((ap) => ap.programs.slug === programSlug)) return false
    return true
  })

  return (
    <section className="rg-major-section !pt-8">
      <div className="rg-container">
        <div className="mb-6">
          <h1 className="font-display text-4xl font-bold">Alerts</h1>
          <p className="mt-2 mb-5 font-body text-[var(--color-text-secondary)]">
            Live transfer bonuses, limited-time offers, and program changes — sorted by urgency.
          </p>
        </div>

        <Suspense fallback={<div className="mb-8 h-10" />}>
          <AlertsFiltersSB
            programs={programs}
            selectedProgram={programSlug ?? null}
            selectedType={type ?? null}
          />
        </Suspense>

        {type || programSlug ? <AlertsGridSB alerts={alerts} /> : <AlertsTieredSB alerts={alerts} />}
      </div>
    </section>
  )
}
