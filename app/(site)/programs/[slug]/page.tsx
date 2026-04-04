import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanityClient'
import { getAlertsByProgram } from '@/lib/queries'
import type { SanityAlert } from '@/lib/types'
import { computeFinalScore } from '@/lib/scoring'
import { PROGRAM_SLUGS, getProgramName } from '@/lib/programs'
import AlertsGrid from '@/components/alerts/AlertsGrid'
import ProgramStatusToggle from '@/components/programs/ProgramStatusToggle'

export const revalidate = 60

export function generateStaticParams() {
  return PROGRAM_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!PROGRAM_SLUGS.includes(slug)) return { title: 'Not Found — crazy4points' }
  const name = getProgramName(slug)
  return {
    title: `${name} Alerts — crazy4points`,
    description: `Live travel rewards alerts tagged with ${name}.`,
  }
}

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { slug } = await params
  const { status: rawStatus } = await searchParams

  if (!PROGRAM_SLUGS.includes(slug)) notFound()

  const status: 'active' | 'all' =
    rawStatus === 'all' ? 'all' : 'active'

  const raw = await sanityFetch<SanityAlert[]>(getAlertsByProgram, { program: slug })

  const now = new Date()

  const filtered =
    status === 'active'
      ? raw.filter((a) => !a.endDate || new Date(a.endDate) > now)
      : raw

  const alerts = filtered
    .map((a) => ({ ...a, finalScore: computeFinalScore(a) }))
    .sort((a, b) => b.finalScore - a.finalScore)

  const programName = getProgramName(slug)

  return (
    <section className="rg-major-section !pt-8">
      <div className="rg-container">

        {/* Header */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold">{programName}</h1>
            <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
              All alerts tagged with this program
            </p>
          </div>
          <Link
            href="/alerts"
            className="font-ui text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
          >
            View All Alerts →
          </Link>
        </div>

        {/* Status toggle */}
        <div className="mb-8">
          <ProgramStatusToggle slug={slug} status={status} />
        </div>

        {/* Alerts */}
        {alerts.length === 0 ? (
          <p className="font-body text-sm text-[var(--color-text-secondary)]">
            No alerts found for this program.
          </p>
        ) : (
          <AlertsGrid alerts={alerts} />
        )}

      </div>
    </section>
  )
}
