'use client'

import { useState, useTransition } from 'react'
import { reviseAlertAction } from './actions'

export function ReviseButton({ alertId }: { alertId: string }) {
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
            const r = await reviseAlertAction(alertId)
            if (!r.ok) {
              setIsError(true)
              setMsg(r.error ?? 'Unknown error')
            } else {
              const parts: string[] = []
              if (typeof r.revisionCount === 'number') parts.push(`${r.revisionCount} edit${r.revisionCount === 1 ? '' : 's'}`)
              if (r.residualLikelyWrong === -1) parts.push('reverify failed')
              else if (typeof r.residualLikelyWrong === 'number') {
                parts.push(r.residualLikelyWrong === 0 ? 'no flags remain' : `${r.residualLikelyWrong} flag${r.residualLikelyWrong === 1 ? '' : 's'} remain`)
              }
              setMsg(`✓ ${parts.join(' · ')}`)
            }
          })
        }}
      >
        {isPending ? 'Revising…' : 'Auto-revise draft'}
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
