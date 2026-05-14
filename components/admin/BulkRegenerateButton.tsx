'use client'

import { useState, useTransition } from 'react'
import { bulkRegeneratePendingAlertsAction } from '@/app/admin/(protected)/alerts/actions'

interface Props {
  pendingCount: number
}

/**
 * Backfills the new writer pipeline across the existing pending_review
 * queue. Confirms before firing because each alert is a real Sonnet+Haiku
 * call (cost + time). Limited to 25 alerts per click; re-click for more.
 */
export default function BulkRegenerateButton({ pendingCount }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [submitting, startTransition] = useTransition()

  if (pendingCount === 0) return null

  function run() {
    if (!confirm(
      `Re-run the writer pipeline on up to 25 of the ${pendingCount} pending alerts? ` +
        `Each call costs ~$0.05 in Sonnet + Haiku.`
    )) {
      return
    }
    setResult(null)
    startTransition(async () => {
      const res = await bulkRegeneratePendingAlertsAction(30, 25)
      if (res.ok) {
        setResult(
          `Done — ${res.processed} re-run, ${res.failed} failed, ${res.skipped} skipped (no intel).`
        )
      } else {
        setResult(`Failed — ${res.error}`)
      }
    })
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={run}
        disabled={submitting}
        className="admin-btn admin-btn-ghost admin-btn-sm"
      >
        {submitting ? 'Re-running…' : `Re-run pipeline (${Math.min(pendingCount, 25)})`}
      </button>
      {result && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--admin-text-muted)',
          }}
        >
          {result}
        </span>
      )}
    </div>
  )
}
