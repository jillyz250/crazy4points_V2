import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertsByProgramSlug, getAllPrograms } from '@/utils/supabase/queries'
import type { AlertWithPrograms } from '@/utils/supabase/queries'
import AlertsGridSB from '@/components/alerts/AlertsGridSB'
import ExpiredAlertsList from '@/components/alerts/ExpiredAlertsList'
import ProgramPageContent from '@/components/programs/ProgramPageContent'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const supabase = createAdminClient()
    const { program } = await getAlertsByProgramSlug(supabase, slug)
    return {
      title: `${program.name} Alerts — crazy4points`,
      description: `All travel rewards alerts for ${program.name} — active deals, transfer bonuses, and archived history.`,
    }
  } catch {
    return { title: 'Program — crazy4points' }
  }
}

function matchesSearch(alert: AlertWithPrograms, query: string): boolean {
  const q = query.toLowerCase()
  return (
    alert.title.toLowerCase().includes(q) ||
    (alert.summary?.toLowerCase().includes(q) ?? false) ||
    (alert.description?.toLowerCase().includes(q) ?? false) ||
    alert.type.toLowerCase().includes(q)
  )
}

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; show?: string }>
}) {
  const { slug } = await params
  const { q = '', show = 'active' } = await searchParams

  const supabase = createAdminClient()

  let program
  let allAlerts: AlertWithPrograms[]
  let programNameBySlug = new Map<string, string>()

  try {
    const [result, allPrograms] = await Promise.all([
      getAlertsByProgramSlug(supabase, slug),
      getAllPrograms(supabase),
    ])
    program = result.program
    allAlerts = result.alerts
    programNameBySlug = new Map(allPrograms.map((p) => [p.slug, p.name]))
  } catch {
    notFound()
  }

  const now = new Date()

  // Split active vs expired
  const active = allAlerts.filter(
    (a) => !a.end_date || new Date(a.end_date) > now
  )
  const expired = allAlerts.filter(
    (a) => a.end_date && new Date(a.end_date) <= now
  )

  const activeFiltered = q ? active.filter((a) => matchesSearch(a, q)) : active
  const expiredFiltered = q ? expired.filter((a) => matchesSearch(a, q)) : expired
  const filteredCount =
    show === 'active'
      ? activeFiltered.length
      : show === 'expired'
        ? expiredFiltered.length
        : activeFiltered.length + expiredFiltered.length

  const tabStyle = (active: boolean) => ({
    display: 'inline-block' as const,
    padding: '0.35rem 0.9rem',
    borderRadius: 'var(--radius-ui)',
    fontSize: '0.8125rem',
    fontWeight: 600 as const,
    fontFamily: 'var(--font-ui)',
    textDecoration: 'none',
    background: active ? 'var(--color-primary)' : 'transparent',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
  })

  const hrefWith = (updates: Record<string, string>) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('show', show)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    return `/programs/${slug}?${params.toString()}`
  }

  return (
    <section className="rg-major-section !pt-8">
      <div className="rg-container">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
              {program.type.replace(/_/g, ' ')}
            </p>
            <h1 className="font-display text-4xl font-bold">{program.name}</h1>
            <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
              {allAlerts.length} alert{allAlerts.length !== 1 ? 's' : ''} on record
            </p>
          </div>
          <Link
            href="/alerts"
            className="font-ui text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
          >
            View All Alerts →
          </Link>
        </div>

        {/* Editorial content (intro / transfer partners / sweet spots / quirks) */}
        <ProgramPageContent program={program} programNameBySlug={programNameBySlug} />

        {/* Alerts heading — only show when content above exists, to mark transition */}
        {(program.intro || (program.transfer_partners?.length ?? 0) > 0 || program.sweet_spots || program.quirks) && (
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: '0.5rem',
              marginTop: '1rem',
            }}
          >
            Alerts
          </h2>
        )}

        {/* Search */}
        <form method="GET" action={`/programs/${slug}`} style={{ marginBottom: '1.25rem' }}>
          <input type="hidden" name="show" value={show} />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder={`Search ${program.name} alerts…`}
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '0.5rem 0.875rem',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-ui)',
              fontSize: '0.9375rem',
              fontFamily: 'var(--font-body)',
              background: 'var(--color-background)',
              color: 'var(--color-text-primary)',
            }}
          />
        </form>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <a href={hrefWith({ show: 'active' })} style={tabStyle(show === 'active')}>
            Active ({active.length})
          </a>
          <a href={hrefWith({ show: 'expired' })} style={tabStyle(show === 'expired')}>
            Expired ({expired.length})
          </a>
          <a href={hrefWith({ show: 'all' })} style={tabStyle(show === 'all')}>
            All ({allAlerts.length})
          </a>
        </div>

        {/* Results */}
        {q && (
          <p className="mb-4 font-body text-sm text-[var(--color-text-secondary)]">
            {filteredCount} result{filteredCount !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
            {' '}
            <a href={`/programs/${slug}?show=${show}`} style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: 'inherit' }}>
              Clear search
            </a>
          </p>
        )}

        {show === 'active' && <AlertsGridSB alerts={activeFiltered} />}

        {show === 'expired' && (
          <div>
            <h2 className="mb-4 font-display text-2xl font-bold">Archived alerts</h2>
            <p className="mb-4 font-body text-sm text-[var(--color-text-secondary)]">
              These offers have ended but live on here for reference. Click any title to open the original alert.
            </p>
            <ExpiredAlertsList alerts={expiredFiltered} />
          </div>
        )}

        {show === 'all' && (
          <>
            <AlertsGridSB alerts={activeFiltered} />
            {expiredFiltered.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <h2 className="mb-3 font-display text-2xl font-bold">Archived alerts</h2>
                <p className="mb-4 font-body text-sm text-[var(--color-text-secondary)]">
                  Past offers for {program.name} — searchable, click to view the original.
                </p>
                <ExpiredAlertsList alerts={expiredFiltered} />
              </div>
            )}
          </>
        )}

        {/* Editorial disclaimer — only when there's editorial content to disclaim */}
        {program.content_updated_at && (
          <p
            style={{
              marginTop: '3rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--color-border-soft)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            Last reviewed {new Date(program.content_updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
            Loyalty program rules change frequently — confirm fees, transfer ratios, and award levels with the program directly before booking.
          </p>
        )}

      </div>
    </section>
  )
}
