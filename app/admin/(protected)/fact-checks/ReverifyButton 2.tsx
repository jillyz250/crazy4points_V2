'use client'

import { useState, useTransition } from 'react'
import { reverifyAlertClaimsAction } from './actions'

export function ReverifyButton({ alertId }: { alertId: string }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  return (
    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        className="rg-btn-secondary"
        disabled={isPending}
        style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
        onClick={() => {
          setMsg(null)
          setIsError(false)
          startTransition(async () => {
            const r = await reverifyAlertClaimsAction(alertId)
            if (!r.ok) {
              setIsError(true)
              setMsg(r.error ?? 'Unknown error')
            } else if (r.verdictCounts) {
              const { likely_correct, likely_wrong, unverifiable } = r.verdictCounts
              setMsg(`✓ ${likely_correct} correct · ${likely_wrong} wrong · ${unverifiable} unverifiable`)
            } else {
              setMsg('Done')
            }
          })
        }}
      >
        {isPending ? 'Re-verifying…' : 'Re-run web verify'}
      </button>
      {msg && (
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-ui)',
            color: isError ? '#c0392b' : '#1e5c2e',
          }}
        >
          {msg}
        </span>
      )}
    </div>
  )
}
