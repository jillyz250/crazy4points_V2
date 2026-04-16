import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getActiveAlertsByFilter, getPrograms } from '@/utils/supabase/queries'
import AlertsGridSB from '@/components/alerts/AlertsGridSB'
import AlertsFiltersSB from '@/components/alerts/AlertsFiltersSB'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Alerts — crazy4points',
  description: 'Live travel rewards alerts — transfer bonuses, limited-time offers, devaluations, and more.',
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; program?: string }>
}) {
  const { type, program: programSlug } = await searchParams
  const supabase = createAdminClient()

  // Resolve program slug → ID if provided
  let programId: string | undefined
  if (programSlug) {
    const programs = await getPrograms(supabase)
    const match = programs.find((p) => p.slug === programSlug)
    programId = match?.id
  }

  const [alerts, programs] = await Promise.all([
    getActiveAlertsByFilter(supabase, type, programId),
    getPrograms(supabase),
  ])

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

        <AlertsGridSB alerts={alerts} />
      </div>
    </section>
  )
}
