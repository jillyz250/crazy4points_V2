import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getAllAlerts, getPendingReviewAlerts } from '@/utils/supabase/queries'
import type { AlertStatus } from '@/utils/supabase/queries'
import { publishAlertAction, expireAlertAction, approveIntelAlertAction, rejectAlertAction } from './actions'

const STATUS_BADGE: Record<AlertStatus, { label: string; bg: string; color: string }> = {
  published:      { label: 'Published',      bg: '#e6f4ea', color: '#1e7e34' },
  draft:          { label: 'Draft',          bg: '#f0f0f0', color: '#555555' },
  pending_review: { label: 'Pending Review', bg: '#fff8e1', color: '#b45309' },
  rejected:       { label: 'Rejected',       bg: '#fdecea', color: '#c0392b' },
  expired:        { label: 'Expired',        bg: '#f3f0f7', color: '#7c5cbf' },
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   '#1e7e34',
  medium: '#b45309',
  low:    '#c0392b',
}

export default async function AdminAlertsPage() {
  const supabase = createAdminClient()
  const [alerts, pendingAlerts] = await Promise.all([
    getAllAlerts(supabase),
    getPendingReviewAlerts(supabase),
  ])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1>Alerts</h1>
        <Link href="/admin/alerts/new" className="rg-btn-primary">
          + New Alert
        </Link>
      </div>

      {/* Pending Review inbox */}
      {pendingAlerts.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontFamily: 'var(--font-ui)', marginBottom: '1rem', color: '#b45309' }}>
            Pending Review ({pendingAlerts.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingAlerts.map((alert) => {
              const intel = alert.intel
              return (
                <div key={alert.id} style={{
                  border: '1px solid #fde68a',
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: 'var(--radius-card)',
                  background: '#fffbeb',
                  padding: '1rem 1.25rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>
                        {alert.title}
                      </p>
                      {intel && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: CONFIDENCE_COLOR[intel.confidence] }}>
                            {intel.confidence.toUpperCase()}
                          </span>
                          {' · '}
                          {intel.source_name}
                          {intel.source_url && (
                            <> · <a href={intel.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>source</a></>
                          )}
                        </p>
                      )}
                      {intel?.raw_text && (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          "{intel.raw_text.slice(0, 200)}{intel.raw_text.length > 200 ? '…' : ''}"
                        </p>
                      )}
                      {(() => {
                        const claims = Array.isArray(alert.fact_check_claims)
                          ? (alert.fact_check_claims as Array<{ claim: string; supported: boolean; severity: string; source_excerpt: string | null }>)
                          : []
                        const unsupported = claims.filter((c) => !c.supported && c.severity === 'high')
                        if (unsupported.length === 0) return null
                        return (
                          <div style={{
                            marginTop: '0.625rem',
                            padding: '0.5rem 0.75rem',
                            background: '#fdecea',
                            border: '1px solid #f5c6cb',
                            borderRadius: 'var(--radius-ui)',
                            fontSize: '0.8125rem',
                            color: '#7a1f1f',
                          }}>
                            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                              ⚠ Unverified claims ({unsupported.length}) — check before publishing:
                            </p>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                              {unsupported.map((c, i) => (
                                <li key={i}>{c.claim}</li>
                              ))}
                            </ul>
                          </div>
                        )
                      })()}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <Link
                        href={`/admin/alerts/${alert.id}/edit`}
                        style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'underline' }}
                      >
                        Edit
                      </Link>
                      <form action={approveIntelAlertAction.bind(null, alert.id)}>
                        <button type="submit" style={{
                          padding: '0.35rem 0.875rem',
                          borderRadius: 'var(--radius-ui)',
                          background: '#1e7e34',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontFamily: 'var(--font-ui)',
                          fontWeight: 600,
                        }}>
                          Approve
                        </button>
                      </form>
                      <form action={rejectAlertAction.bind(null, alert.id)}>
                        <button type="submit" style={{
                          padding: '0.35rem 0.875rem',
                          borderRadius: 'var(--radius-ui)',
                          background: '#fdecea',
                          color: '#c0392b',
                          border: '1px solid #f5c6cb',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          fontFamily: 'var(--font-ui)',
                          fontWeight: 600,
                        }}>
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All alerts table */}
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
