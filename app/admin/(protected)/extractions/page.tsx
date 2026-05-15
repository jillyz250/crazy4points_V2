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

  return (
    <div>
      <PageHeader
        title="Extractions"
        description="One hub to run extractions, mark entities verified, and audit recent jobs. Replaces the standalone Refresh Queue and Card Extractions pages."
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
