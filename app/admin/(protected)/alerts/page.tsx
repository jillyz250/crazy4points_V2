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

export default async function AdminAlertsPage() {
  const supabase = createAdminClient()
  const [alerts, pendingAlerts] = await Promise.all([
    getAllAlerts(supabase),
    getPendingReviewAlerts(supabase),
  ])

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
