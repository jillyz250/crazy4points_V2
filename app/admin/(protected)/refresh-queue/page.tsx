import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getRefreshQueue, getRefreshQueueByType } from '@/utils/supabase/queries'
import type { RefreshQueueItem } from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import {
  REFRESH_ENTITY_LABELS,
  urgencyForAge,
  type RefreshEntityType,
} from '@/lib/admin/refresh-cadences'
import { markVerifiedAction } from './actions'

export const revalidate = 60

const URGENCY_TONE = {
  on_time: 'success',
  overdue: 'warning',
  very_overdue: 'danger',
  critical: 'danger',
} as const

const URGENCY_LABEL = {
  on_time: 'On time',
  overdue: 'Overdue',
  very_overdue: 'Very overdue',
  critical: 'Critical',
} as const

function entityLabel(entityType: string): string {
  if (entityType in REFRESH_ENTITY_LABELS) {
    return REFRESH_ENTITY_LABELS[entityType as RefreshEntityType]
  }
  return entityType.replace(/_/g, ' ')
}

function formatAge(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365)
    return `${years}y${days % 365 ? ` ${Math.floor((days % 365) / 30)}mo` : ''}`
  }
  if (days >= 60) {
    const months = Math.floor(days / 30)
    return `${months}mo`
  }
  if (days >= 14) {
    const weeks = Math.floor(days / 7)
    return `${weeks}w`
  }
  return `${days}d`
}

export default async function RefreshQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const supabase = createAdminClient()

  const [items, byType] = await Promise.all([
    getRefreshQueue(supabase, { entityType: params.type }),
    getRefreshQueueByType(supabase),
  ])

  const total = Object.values(byType).reduce((sum, n) => sum + n, 0)

  return (
    <div>
      <PageHeader
        title="Refresh Queue"
        description={`${total} ${total === 1 ? 'item is' : 'items are'} due for re-verification. Click an entity to edit it; saving auto-bumps last_verified and removes it from this list until the next cadence cycle.`}
      />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <FilterChip
          href="/admin/refresh-queue"
          active={!params.type}
          label="All"
          count={total}
        />
        {Object.entries(byType)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => (
            <FilterChip
              key={type}
              href={`/admin/refresh-queue?type=${encodeURIComponent(type)}`}
              active={params.type === type}
              label={entityLabel(type)}
              count={count}
            />
          ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="🎉 All current"
          description="Nothing in the queue right now. Future entries will appear automatically once their cadence elapses."
        />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th style={{ textAlign: 'right' }}>Age</th>
                  <th style={{ textAlign: 'right' }}>Cadence</th>
                  <th>Last verified</th>
                  <th>Status</th>
                  <th style={{ width: '5rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <RefreshQueueRow key={`${item.entity_type}-${item.entity_id}`} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
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

function RefreshQueueRow({ item }: { item: RefreshQueueItem }) {
  const urgency = urgencyForAge(item.age_days, item.cadence_days)
  return (
    <tr>
      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
        {entityLabel(item.entity_type)}
      </td>
      <td style={{ fontWeight: 500 }}>{item.entity_name}</td>
      <td style={{ textAlign: 'right', fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums' }}>
        {formatAge(item.age_days)}
      </td>
      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
        {item.cadence_days}d
      </td>
      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
        {item.last_verified ?? <em>never</em>}
      </td>
      <td>
        <Badge tone={URGENCY_TONE[urgency]}>{URGENCY_LABEL[urgency]}</Badge>
      </td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
          <form action={markVerifiedAction}>
            <input type="hidden" name="entity_type" value={item.entity_type} />
            <input type="hidden" name="entity_id" value={item.entity_id} />
            <button
              type="submit"
              className="admin-btn admin-btn-ghost admin-btn-sm"
              title="Confirm data is still current without editing"
            >
              ✓ Mark verified
            </button>
          </form>
          <Link href={item.edit_url} className="admin-btn admin-btn-ghost admin-btn-sm">
            Edit
          </Link>
        </div>
      </td>
    </tr>
  )
}
