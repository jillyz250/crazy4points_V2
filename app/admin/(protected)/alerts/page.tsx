import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getAllAlerts, getPendingReviewAlerts } from '@/utils/supabase/queries'
import type { AlertStatus } from '@/utils/supabase/queries'
import { publishAlertAction, expireAlertAction } from './actions'
import PendingReviewBulk from '@/components/admin/PendingReviewBulk'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { LinkButton } from '@/components/admin/ui/Button'
import { Badge } from '@/components/admin/ui/Badge'
import { Card } from '@/components/admin/ui/Card'
import { EmptyState } from '@/components/admin/ui/EmptyState'

const STATUS_TONE: Record<AlertStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' | 'accent' }> = {
  published:      { label: 'Published',      tone: 'success' },
  draft:          { label: 'Draft',          tone: 'neutral' },
  pending_review: { label: 'Pending',        tone: 'warning' },
  rejected:       { label: 'Rejected',       tone: 'danger' },
  soft_rejected:  { label: 'Snoozed',        tone: 'neutral' },
  expired:        { label: 'Expired',        tone: 'accent' },
}

type SortField = 'title' | 'type' | 'status' | 'end_date'
type SortDir = 'asc' | 'desc'

// Status sort order — most actionable first.
const STATUS_RANK: Record<AlertStatus, number> = {
  pending_review: 0,
  draft: 1,
  published: 2,
  expired: 3,
  soft_rejected: 4,
  rejected: 5,
}

function compareAlerts(field: SortField, dir: SortDir) {
  const sign = dir === 'asc' ? 1 : -1
  return (a: { title: string; type: string; status: AlertStatus; end_date: string | null }, b: typeof a) => {
    let cmp = 0
    if (field === 'title') cmp = a.title.localeCompare(b.title)
    else if (field === 'type') cmp = a.type.localeCompare(b.type)
    else if (field === 'status') cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status]
    else if (field === 'end_date') {
      // Nulls always last, regardless of asc/desc.
      const av = a.end_date ? new Date(a.end_date).getTime() : null
      const bv = b.end_date ? new Date(b.end_date).getTime() : null
      if (av === null && bv === null) cmp = 0
      else if (av === null) return 1
      else if (bv === null) return -1
      else cmp = av - bv
    }
    return cmp * sign
  }
}

type SortOption = { value: string; label: string }

// Short, scannable pill labels — fewer options, clearer wording. Order matters.
const SORT_PILLS: SortOption[] = [
  { value: '',              label: 'Newest' },
  { value: 'status:asc',    label: 'Pending first' },
  { value: 'end_date:asc',  label: 'Expires soon' },
  { value: 'title:asc',     label: 'A → Z' },
  { value: 'title:desc',    label: 'Z → A' },
]

export default async function AdminAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string }>
}) {
  const sp = await searchParams
  // sortBy is "<field>:<dir>" — single combined param keeps the form simple.
  const validFields: SortField[] = ['title', 'type', 'status', 'end_date']
  let sort: SortField | null = null
  let dir: SortDir = 'asc'
  if (sp.sortBy) {
    const [f, d] = sp.sortBy.split(':')
    if (validFields.includes(f as SortField)) sort = f as SortField
    if (d === 'desc') dir = 'desc'
  }

  const supabase = createAdminClient()
  const [allAlerts, pendingAlerts] = await Promise.all([
    getAllAlerts(supabase),
    getPendingReviewAlerts(supabase),
  ])
  const alerts = sort ? [...allAlerts].sort(compareAlerts(sort, dir)) : allAlerts

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Review pending drafts, publish, and manage the live catalog."
        actions={<LinkButton href="/admin/alerts/new" variant="primary">+ New Alert</LinkButton>}
      />

      {pendingAlerts.length > 0 && (
        <PendingReviewBulk
          alerts={pendingAlerts.map((a) => ({
            id: a.id,
            title: a.title,
            fact_check_claims: a.fact_check_claims,
            intel: a.intel
              ? {
                  confidence: a.intel.confidence,
                  source_name: a.intel.source_name,
                  source_url: a.intel.source_url,
                  raw_text: a.intel.raw_text,
                }
              : null,
          }))}
        />
      )}

      <div id="all-alerts" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', margin: '1.5rem 0 0.75rem' }}>
        <h2 style={{ margin: 0 }}>All Alerts</h2>
        {alerts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', marginRight: '0.25rem' }}>
              Sort
            </span>
            {SORT_PILLS.map((p) => {
              const current = sort ? `${sort}:${dir}` : ''
              const active = current === p.value
              const href = p.value
                ? `/admin/alerts?sortBy=${p.value}#all-alerts`
                : `/admin/alerts#all-alerts`
              return (
                <Link
                  key={p.value || 'default'}
                  href={href}
                  scroll={false}
                  className={`admin-btn admin-btn-sm ${active ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                >
                  {p.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {alerts.length === 0 ? (
        <EmptyState title="No alerts yet" description="Create one, or wait for Scout to draft something." />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const s = STATUS_TONE[alert.status] ?? STATUS_TONE.draft
                  return (
                    <tr key={alert.id}>
                      <td style={{ color: 'var(--admin-text)', fontWeight: 500 }}>{alert.title}</td>
                      <td style={{ color: 'var(--admin-text-muted)', textTransform: 'capitalize' }}>
                        {alert.type.replace(/_/g, ' ')}
                      </td>
                      <td><Badge tone={s.tone}>{s.label}</Badge></td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>
                        {alert.end_date
                          ? new Date(alert.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/admin/alerts/${alert.id}/edit`}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                          >
                            Edit
                          </Link>
                          {(alert.status === 'draft' || alert.status === 'pending_review') && (
                            <form action={publishAlertAction.bind(null, alert.id)}>
                              <button type="submit" className="admin-btn admin-btn-secondary admin-btn-sm">
                                Publish
                              </button>
                            </form>
                          )}
                          {alert.status === 'published' && (
                            <form action={expireAlertAction.bind(null, alert.id)}>
                              <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">
                                Expire
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
