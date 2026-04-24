'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  approveIntelAlertAction,
  rejectAlertAction,
  bulkApproveIntelAlertsAction,
  bulkRejectAlertsAction,
} from '@/app/admin/(protected)/alerts/actions'
import FactCheckWarnings from '@/components/admin/FactCheckWarnings'
import RegenerateButton from '@/components/admin/RegenerateButton'
import { Badge } from '@/components/admin/ui/Badge'

type ConfTone = 'success' | 'warning' | 'danger' | 'neutral'
const CONFIDENCE_TONE: Record<string, ConfTone> = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
}

type Intel = {
  confidence: string
  source_name: string
  source_url: string | null
  raw_text: string | null
} | null

export type PendingAlert = {
  id: string
  title: string
  fact_check_claims: unknown
  intel: Intel
}

export default function PendingReviewBulk({ alerts }: { alerts: PendingAlert[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const allIds = alerts.map((a) => a.id)
  const allSelected = selected.size > 0 && selected.size === allIds.length
  const someSelected = selected.size > 0

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }
  function bulkApprove() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!confirm(`Approve and publish ${ids.length} alert${ids.length === 1 ? '' : 's'}?`)) return
    startTransition(() => {
      bulkApproveIntelAlertsAction(ids)
    })
  }
  function bulkReject() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!confirm(`Reject ${ids.length} alert${ids.length === 1 ? '' : 's'}?`)) return
    startTransition(() => {
      bulkRejectAlertsAction(ids)
    })
  }

  return (
    <section
      className="admin-card"
      style={{
        marginBottom: '1.5rem',
        borderLeft: '3px solid var(--admin-warning)',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--admin-border)',
          background: 'var(--admin-warning-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <h2 style={{ margin: 0, fontSize: '0.9375rem' }}>Pending Review</h2>
          <Badge tone="warning">{alerts.length}</Badge>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            Select all
          </label>
          <button
            type="button"
            onClick={bulkApprove}
            disabled={!someSelected || isPending}
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            {isPending ? 'Working…' : `Approve (${selected.size})`}
          </button>
          <button
            type="button"
            onClick={bulkReject}
            disabled={!someSelected || isPending}
            className="admin-btn admin-btn-danger admin-btn-sm"
          >
            Reject
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {alerts.map((alert, idx) => {
          const intel = alert.intel
          const checked = selected.has(alert.id)
          return (
            <div
              key={alert.id}
              style={{
                padding: '0.875rem 1rem',
                borderBottom: idx === alerts.length - 1 ? 'none' : '1px solid var(--admin-border)',
                background: checked ? 'var(--admin-surface-alt)' : 'var(--admin-surface)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(alert.id)}
                style={{ marginTop: '0.3125rem', flexShrink: 0 }}
                aria-label={`Select ${alert.title}`}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)', marginBottom: '0.25rem' }}>
                  {alert.title}
                </div>
                {intel && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                    <Badge tone={CONFIDENCE_TONE[intel.confidence] ?? 'neutral'}>{intel.confidence}</Badge>
                    <span>{intel.source_name}</span>
                    {intel.source_url && (
                      <a href={intel.source_url} target="_blank" rel="noopener noreferrer">
                        source ↗
                      </a>
                    )}
                  </div>
                )}
                {intel?.raw_text && (
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--admin-text-muted)',
                      fontStyle: 'italic',
                      margin: '0.25rem 0 0.5rem',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    &ldquo;{intel.raw_text.slice(0, 200)}
                    {intel.raw_text.length > 200 ? '…' : ''}&rdquo;
                  </p>
                )}
                <FactCheckWarnings alertId={alert.id} claims={alert.fact_check_claims} />
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Link href={`/admin/alerts/${alert.id}/edit`} className="admin-btn admin-btn-ghost admin-btn-sm">
                  Edit
                </Link>
                <RegenerateButton alertId={alert.id} />
                <form action={approveIntelAlertAction.bind(null, alert.id)}>
                  <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">
                    Approve
                  </button>
                </form>
                <form action={rejectAlertAction.bind(null, alert.id)}>
                  <button type="submit" className="admin-btn admin-btn-danger admin-btn-sm">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
