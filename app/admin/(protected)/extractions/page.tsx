import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import {
  getExtractionsBrowse,
  getRecentExtractions,
  type ExtractionsBrowseItem,
} from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import {
  REFRESH_ENTITY_LABELS,
  urgencyForAge,
  type RefreshEntityType,
} from '@/lib/admin/refresh-cadences'
import ExtractionsBrowseTable from './ExtractionsBrowseTable'
import { markVerifiedAction } from './actions'

export const revalidate = 60

function entityLabel(entityType: string): string {
  if (entityType in REFRESH_ENTITY_LABELS) {
    return REFRESH_ENTITY_LABELS[entityType as RefreshEntityType]
  }
  return entityType.replace(/_/g, ' ')
}

function isStale(item: ExtractionsBrowseItem): boolean {
  return urgencyForAge(item.age_days, item.cadence_days) !== 'on_time'
}

export default async function ExtractionsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; stale?: string; tab?: string }>
}) {
  const params = await searchParams
  const staleOnly = params.stale !== 'false'  // default true
  const tab = params.tab === 'history' ? 'history' : 'browse'

  const supabase = createAdminClient()

  const [allItems, recent] = await Promise.all([
    getExtractionsBrowse(supabase, { entityType: params.type }),
    tab === 'history' ? getRecentExtractions(supabase, 100) : Promise.resolve([]),
  ])

  // Counts for type chips: always computed from the full (unfiltered-by-type) set,
  // so chip counts don't collapse when a chip is active.
  const allItemsUnfiltered = params.type
    ? await getExtractionsBrowse(supabase)
    : allItems

  const visible = staleOnly ? allItems.filter(isStale) : allItems

  const countsByType: Record<string, number> = {}
  for (const item of allItemsUnfiltered) {
    const key = item.entity_type
    if (!staleOnly || isStale(item)) {
      countsByType[key] = (countsByType[key] ?? 0) + 1
    }
  }
  const totalCount = Object.values(countsByType).reduce((s, n) => s + n, 0)

  // Fetch quarterly refresh status — last cron run + next scheduled date
  const [{ data: lastRun }, { data: rotatingCards }] = await Promise.all([
    supabase
      .from('cron_runs')
      .select('status, started_at, completed_at, cards_attempted, cards_succeeded, cards_failed, error_message')
      .eq('job_name', 'quarterly-rotating-refresh')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('credit_cards')
      .select('name, slug')
      .not('rotating_categories_url', 'is', null)
      .eq('is_active', true),
  ])
  const quarterlyCards = (rotatingCards ?? []) as Array<{ name: string; slug: string }>

  return (
    <div>
      <PageHeader
        title="Extractions"
        description="One hub to run extractions, mark entities verified, and audit recent jobs. Replaces the standalone Refresh Queue and Card Extractions pages."
      />

      {/* Quarterly rotating-categories auto-refresh status */}
      <QuarterlyRefreshWidget
        lastRun={lastRun as {
          status: string
          started_at: string
          completed_at: string | null
          cards_attempted: number | null
          cards_succeeded: number | null
          cards_failed: number | null
          error_message: string | null
        } | null}
        cards={quarterlyCards}
      />

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.25rem',
          borderBottom: '1px solid var(--color-border-soft)',
        }}
      >
        <TabLink
          href={buildHref({ type: params.type, stale: params.stale, tab: undefined })}
          active={tab === 'browse'}
          label="Browse & extract"
        />
        <TabLink
          href={buildHref({ type: params.type, stale: params.stale, tab: 'history' })}
          active={tab === 'history'}
          label="Recent extractions"
        />
      </div>

      {tab === 'browse' ? (
        <>
          {/* Stale toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
            }}
          >
            <span style={{ color: 'var(--color-text-secondary)' }}>Show:</span>
            <Link
              href={buildHref({ type: params.type, stale: undefined, tab: undefined })}
              style={chipStyle(staleOnly)}
            >
              Stale only
            </Link>
            <Link
              href={buildHref({ type: params.type, stale: 'false', tab: undefined })}
              style={chipStyle(!staleOnly)}
            >
              All
            </Link>
          </div>

          {/* Type filter chips */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            <FilterChip
              href={buildHref({ type: undefined, stale: params.stale, tab: undefined })}
              active={!params.type}
              label="All"
              count={totalCount}
            />
            {Object.entries(countsByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <FilterChip
                  key={type}
                  href={buildHref({ type, stale: params.stale, tab: undefined })}
                  active={params.type === type}
                  label={entityLabel(type)}
                  count={count}
                />
              ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title={staleOnly ? '🎉 All current' : 'Nothing matches'}
              description={
                staleOnly
                  ? 'No stale entities in scope. Switch to "All" to browse everything.'
                  : 'Try a different type filter.'
              }
            />
          ) : (
            <Card>
              <ExtractionsBrowseTable
                rows={visible}
                markVerifiedAction={markVerifiedAction}
              />
            </Card>
          )}
        </>
      ) : (
        <RecentExtractionsTable rows={recent} />
      )}
    </div>
  )
}

function buildHref({
  type,
  stale,
  tab,
}: {
  type?: string
  stale?: string
  tab?: string
}): string {
  const sp = new URLSearchParams()
  if (type) sp.set('type', type)
  if (stale) sp.set('stale', stale)
  if (tab) sp.set('tab', tab)
  const qs = sp.toString()
  return `/admin/extractions${qs ? '?' + qs : ''}`
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.625rem',
    borderRadius: '9999px',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    fontWeight: active ? 600 : 500,
    background: active ? 'var(--color-primary)' : 'var(--color-background-soft)',
    color: active ? '#fff' : 'var(--color-text-primary)',
    border: '1px solid var(--color-border-soft)',
    textDecoration: 'none',
  }
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      style={{
        padding: '0.625rem 1rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.875rem',
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
        marginBottom: '-1px',
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  )
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string
  active: boolean
  label: string
  count: number
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '9999px',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        fontWeight: active ? 600 : 500,
        background: active ? 'var(--color-primary)' : 'var(--color-background-soft)',
        color: active ? '#fff' : 'var(--color-text-primary)',
        border: '1px solid var(--color-border-soft)',
        textDecoration: 'none',
      }}
    >
      {label}
      <span
        style={{
          fontSize: '0.6875rem',
          color: active ? 'rgba(255,255,255,0.85)' : 'var(--color-text-secondary)',
        }}
      >
        {count}
      </span>
    </Link>
  )
}

function RecentExtractionsTable({
  rows,
}: {
  rows: Awaited<ReturnType<typeof getRecentExtractions>>
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No extractions yet"
        description="Run an extraction from the Browse tab to populate this history."
      />
    )
  }
  return (
    <Card>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Kind</th>
              <th>Name</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Applied / Skipped</th>
              <th style={{ textAlign: 'right' }}>In / Out tokens</th>
              <th style={{ textAlign: 'right' }}>Cost</th>
              <th>Error</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.kind}-${r.id}`}>
                <td
                  style={{
                    whiteSpace: 'nowrap',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.8125rem',
                  }}
                >
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.8125rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {r.kind}
                </td>
                <td style={{ fontWeight: 500 }}>{r.entity_name}</td>
                <td>
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.75rem',
                      color:
                        r.status === 'completed' || r.status === 'saved'
                          ? 'var(--color-primary)'
                          : r.status === 'failed'
                            ? '#b91c1c'
                            : 'var(--color-text-secondary)',
                    }}
                  >
                    {r.status}
                  </span>
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontFamily: 'var(--font-ui)',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.8125rem',
                  }}
                >
                  {r.applied_count + r.skipped_count > 0
                    ? `${r.applied_count} / ${r.skipped_count}`
                    : '—'}
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontFamily: 'var(--font-ui)',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {r.input_tokens ?? '—'} / {r.output_tokens ?? '—'}
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontFamily: 'var(--font-ui)',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {r.cost_usd != null ? `$${r.cost_usd.toFixed(4)}` : '—'}
                </td>
                <td
                  style={{
                    color: '#b91c1c',
                    fontSize: '0.75rem',
                    maxWidth: '16rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.error_message ?? ''}
                </td>
                <td>
                  <Link
                    href={r.extract_url}
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/**
 * Auto-refresh status widget for rotating-category cards. Shows the last cron
 * run's outcome + the next scheduled run + the cards that will get refreshed.
 *
 * Cron schedule (from vercel.json):
 *   - 14:00 UTC on the 15th of Mar/Jun/Sep/Dec (catches issuer announcements)
 *   - 14:00 UTC on the 1st of Jan/Apr/Jul/Oct (catches quarter boundary)
 */
function QuarterlyRefreshWidget({
  lastRun,
  cards,
}: {
  lastRun:
    | {
        status: string
        started_at: string
        completed_at: string | null
        cards_attempted: number | null
        cards_succeeded: number | null
        cards_failed: number | null
        error_message: string | null
      }
    | null
  cards: Array<{ name: string; slug: string }>
}) {
  if (cards.length === 0) return null  // No rotating cards configured yet

  // Compute the next scheduled run (whichever is sooner: 15th of M-1 or 1st of M)
  const now = new Date()
  function nextOf(monthsZeroIdx: number[], day: number): Date {
    const candidates = monthsZeroIdx.map((m) => {
      const y = now.getFullYear()
      const d = new Date(Date.UTC(y, m, day, 14, 0, 0))
      if (d <= now) d.setUTCFullYear(y + 1)
      return d
    })
    candidates.sort((a, b) => a.getTime() - b.getTime())
    return candidates[0]
  }
  const next15 = nextOf([2, 5, 8, 11], 15)  // Mar/Jun/Sep/Dec 15
  const next1 = nextOf([0, 3, 6, 9], 1)  // Jan/Apr/Jul/Oct 1
  const nextRun = next15 < next1 ? next15 : next1
  const daysUntil = Math.max(0, Math.ceil((nextRun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const statusEmoji =
    lastRun?.status === 'success' ? '🟢'
    : lastRun?.status === 'partial' ? '🟡'
    : lastRun?.status === 'failed' ? '🔴'
    : '⚪'
  const statusLabel =
    lastRun?.status === 'success' ? 'Last run succeeded'
    : lastRun?.status === 'partial' ? 'Last run partial'
    : lastRun?.status === 'failed' ? 'Last run failed'
    : 'Never run yet'

  return (
    <section
      style={{
        marginBottom: '1.5rem',
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, #6B2D8F 0%, #4A1F66 100%)',
        borderRadius: 'var(--radius-card)',
        color: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.25rem', color: '#fff' }}>
            🔄 Quarterly auto-refresh
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Rotating-category cards re-extract automatically on the 15th of Mar/Jun/Sep/Dec (catches issuer announcements) + the 1st of each new quarter (backup).
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(212, 175, 55, 0.95)', margin: '0 0 0.25rem' }}>
            Next run
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: '#fff', margin: 0 }}>
            {nextRun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            in {daysUntil} day{daysUntil === 1 ? '' : 's'} · 14:00 UTC
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
        }}
      >
        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 0.125rem', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Last run
          </p>
          <p style={{ color: '#fff', margin: 0 }}>
            {statusEmoji} {statusLabel}
            {lastRun ? (
              <>
                {' · '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {new Date(lastRun.started_at).toLocaleDateString()}
                </span>
                {lastRun.cards_succeeded != null && lastRun.cards_attempted != null ? (
                  <>
                    {' · '}
                    <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {lastRun.cards_succeeded}/{lastRun.cards_attempted} cards
                    </span>
                  </>
                ) : null}
              </>
            ) : null}
          </p>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 0.125rem', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Cards covered ({cards.length})
          </p>
          <p style={{ color: '#fff', margin: 0 }}>
            {cards.map((c) => c.name).join(' · ')}
          </p>
        </div>
      </div>
    </section>
  )
}
