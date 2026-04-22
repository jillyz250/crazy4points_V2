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

const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#1e7e34',
  medium: '#b45309',
  low: '#c0392b',
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
    <div style={{ marginBottom: '2.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontFamily: 'var(--font-ui)', margin: 0, color: '#b45309' }}>
          Pending Review ({alerts.length})
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            Select all
          </label>
          <button
            type="button"
            onClick={bulkApprove}
            disabled={!someSelected || isPending}
            style={{
              padding: '0.35rem 0.875rem',
              borderRadius: 'var(--radius-ui)',
              background: someSelected ? '#1e7e34' : '#cfd8dc',
              color: '#fff',
              border: 'none',
              cursor: someSelected && !isPending ? 'pointer' : 'not-allowed',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
            }}
          >
            {isPending ? 'Working…' : `Approve selected (${selected.size})`}
          </button>
          <button
            type="button"
            onClick={bulkReject}
            disabled={!someSelected || isPending}
            style={{
              padding: '0.35rem 0.875rem',
              borderRadius: 'var(--radius-ui)',
              background: '#fdecea',
              color: '#c0392b',
              border: '1px solid #f5c6cb',
              cursor: someSelected && !isPending ? 'pointer' : 'not-allowed',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              opacity: someSelected ? 1 : 0.6,
            }}
          >
            Reject selected
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {alerts.map((alert) => {
          const intel = alert.intel
          const checked = selected.has(alert.id)
          return (
            <div
              key={alert.id}
              style={{
                border: checked ? '1px solid #f59e0b' : '1px solid #fde68a',
                borderLeft: '4px solid #f59e0b',
                borderRadius: 'var(--radius-card)',
                background: checked ? '#fff3cd' : '#fffbeb',
                padding: '1rem 1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(alert.id)}
                    style={{ marginTop: '0.25rem', flexShrink: 0 }}
                    aria-label={`Select ${alert.title}`}
                  />
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
                          <>
                            {' '}·{' '}
                            <a href={intel.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                              source
                            </a>
                          </>
                        )}
                      </p>
                    )}
                    {intel?.raw_text && (
                      <p
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                          fontStyle: 'italic',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        "{intel.raw_text.slice(0, 200)}
                        {intel.raw_text.length > 200 ? '…' : ''}"
                      </p>
                    )}
                    <FactCheckWarnings alertId={alert.id} claims={alert.fact_check_claims} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                  <Link
                    href={`/admin/alerts/${alert.id}/edit`}
                    style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'underline' }}
                  >
                    Edit
                  </Link>
                  <form action={approveIntelAlertAction.bind(null, alert.id)}>
                    <button
                      type="submit"
                      style={{
                        padding: '0.35rem 0.875rem',
                        borderRadius: 'var(--radius-ui)',
                        background: '#1e7e34',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontFamily: 'var(--font-ui)',
                        fontWeight: 600,
                      }}
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectAlertAction.bind(null, alert.id)}>
                    <button
                      type="submit"
                      style={{
                        padding: '0.35rem 0.875rem',
                        borderRadius: 'var(--radius-ui)',
                        background: '#fdecea',
                        color: '#c0392b',
                        border: '1px solid #f5c6cb',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontFamily: 'var(--font-ui)',
                        fontWeight: 600,
                      }}
                    >
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
  )
}
