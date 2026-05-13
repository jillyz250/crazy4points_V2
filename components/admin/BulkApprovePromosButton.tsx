'use client'

import { useState, useTransition } from 'react'

type BulkResult = { succeeded: number; failed: number }

/**
 * "Approve & publish all pending" button. Calls the bulk server
 * action with every pending row's id (passed from server-side).
 * Confirms before running because it publishes everything in one
 * shot — a non-trivial action.
 */
export default function BulkApprovePromosButton({
  ids,
  action,
}: {
  ids: string[]
  action: (ids: string[]) => Promise<BulkResult>
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<BulkResult | null>(null)

  if (ids.length === 0) return null

  const handleClick = () => {
    if (
      !confirm(
        `Approve and publish ALL ${ids.length} pending promos? This makes them visible on the public site immediately.`,
      )
    ) {
      return
    }
    setResult(null)
    startTransition(async () => {
      const r = await action(ids)
      setResult(r)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.375rem' }}>
      <button
        type="button"
        className="admin-btn admin-btn-primary admin-btn-sm"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? 'Publishing…' : `Approve & publish all ${ids.length}`}
      </button>
      {result && (
        <span
          style={{
            fontSize: '0.75rem',
            color: result.failed > 0 ? 'var(--admin-warning)' : 'var(--admin-success)',
          }}
        >
          {result.succeeded} published · {result.failed} failed. Refresh to see queue update.
        </span>
      )}
    </div>
  )
}
