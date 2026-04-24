'use client'

import { useState, useTransition } from 'react'
import { rebuildBriefHtmlAction } from './actions'

export function RebuildButton({ briefId }: { briefId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        className="admin-btn admin-btn-secondary admin-btn-sm"
        disabled={isPending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await rebuildBriefHtmlAction(briefId)
            if (!result.ok) setError(result.error ?? 'Unknown error')
          })
        }}
      >
        {isPending ? 'Rebuilding…' : 'Rebuild'}
      </button>
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--admin-danger)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
