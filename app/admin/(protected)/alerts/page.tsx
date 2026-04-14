import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getAllAlerts } from '@/utils/supabase/queries'
import type { AlertStatus } from '@/utils/supabase/queries'
import { publishAlertAction, expireAlertAction } from './actions'

const STATUS_BADGE: Record<AlertStatus, { label: string; bg: string; color: string }> = {
  published:      { label: 'Published',      bg: '#e6f4ea', color: '#1e7e34' },
  draft:          { label: 'Draft',          bg: '#f0f0f0', color: '#555555' },
  pending_review: { label: 'Pending Review', bg: '#fff8e1', color: '#b45309' },
  rejected:       { label: 'Rejected',       bg: '#fdecea', color: '#c0392b' },
  expired:        { label: 'Expired',        bg: '#f3f0f7', color: '#7c5cbf' },
}

export default async function AdminAlertsPage() {
  const supabase = createAdminClient()
  const alerts = await getAllAlerts(supabase)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1>Alerts</h1>
        <Link href="/admin/alerts/new" className="rg-btn-primary">
          + New Alert
        </Link>
      </div>

      {alerts.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>No alerts yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-soft)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Title</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Type</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Status</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Expires</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => {
                const badge = STATUS_BADGE[alert.status] ?? STATUS_BADGE.draft
                return (
                  <tr key={alert.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-primary)' }}>
                      {alert.title}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                      {alert.type.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-ui)',
                        letterSpacing: '0.02em',
                        background: badge.bg,
                        color: badge.color,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                      {alert.end_date
                        ? new Date(alert.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                        <Link
                          href={`/admin/alerts/${alert.id}/edit`}
                          style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: '0.8125rem' }}
                        >
                          Edit
                        </Link>
                        {(alert.status === 'draft' || alert.status === 'pending_review') && (
                          <form action={publishAlertAction.bind(null, alert.id)}>
                            <button
                              type="submit"
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#1e7e34', textDecoration: 'underline', fontSize: '0.8125rem', fontFamily: 'var(--font-body)' }}
                            >
                              Publish
                            </button>
                          </form>
                        )}
                        {alert.status === 'published' && (
                          <form action={expireAlertAction.bind(null, alert.id)}>
                            <button
                              type="submit"
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#b45309', textDecoration: 'underline', fontSize: '0.8125rem', fontFamily: 'var(--font-body)' }}
                            >
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
      )}
    </div>
  )
}
