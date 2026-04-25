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
  rejected: 4,
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

function SortHeader({
  field,
  label,
  current,
  align,
}: {
  field: SortField
  label: string
  current: { sort: SortField | null; dir: SortDir }
  align?: 'left' | 'right'
}) {
  const active = current.sort === field
  const nextDir: SortDir = active && current.dir === 'asc' ? 'desc' : 'asc'
  const arrow = active ? (current.dir === 'asc' ? '↑' : '↓') : ''
  return (
    <th style={{ textAlign: align ?? 'left' }}>
      <Link
        href={`/admin/alerts?sort=${field}&dir=${nextDir}`}
        scroll={false}
        style={{
          color: 'inherit',
          textDecoration: active ? 'underline' : 'none',
          fontWeight: active ? 700 : 'inherit',
          display: 'inline-flex',
          gap: '0.25rem',
          alignItems: 'center',
        }}
      >
        {label}
        {arrow && <span aria-hidden="true">{arrow}</span>}
      </Link>
    </th>
  )
}

export default async function AdminAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>
}) {
  const sp = await searchParams
  const validFields: SortField[] = ['title', 'type', 'status', 'end_date']
  const sort: SortField | null = validFields.includes(sp.sort as SortField) ? (sp.sort as SortField) : null
  const dir: SortDir = sp.dir === 'desc' ? 'desc' : 'asc'

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

      <h2 style={{ margin: '1.5rem 0 0.75rem' }}>All Alerts</h2>
      {alerts.length === 0 ? (
        <EmptyState title="No alerts yet" description="Create one, or wait for Scout to draft something." />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <SortHeader field="title" label="Title" current={{ sort, dir }} />
                  <SortHeader field="type" label="Type" current={{ sort, dir }} />
                  <SortHeader field="status" label="Status" current={{ sort, dir }} />
                  <SortHeader field="end_date" label="Expires" current={{ sort, dir }} />
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
