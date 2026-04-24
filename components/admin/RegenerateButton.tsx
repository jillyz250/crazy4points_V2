'use client'

import { useState, useTransition } from 'react'
import { regenerateAlertDraftAction } from '@/app/admin/(protected)/alerts/actions'

export default function RegenerateButton({ alertId }: { alertId: string }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  return (
    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm('Regenerate this draft from the original source? This overwrites the current title, summary, description, and program tags with fresh AI output using the latest rules. Manual edits will be lost.')) return
          setMsg(null)
          setIsError(false)
          startTransition(async () => {
            const r = await regenerateAlertDraftAction(alertId)
            if (!r.ok) {
              setIsError(true)
              setMsg(r.error ?? 'Unknown error')
            } else if (r.verdictCounts) {
              const { supported, likely_correct, likely_wrong, unverifiable } = r.verdictCounts
              setMsg(`✓ ${supported} supported · ${likely_correct} correct · ${likely_wrong} wrong · ${unverifiable} unverifiable`)
            } else {
              setMsg('✓ Regenerated')
            }
          })
        }}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-ui)',
          background: '#f3e8ff',
          color: '#6B2D8F',
          border: '1px solid #d8b4fe',
          cursor: isPending ? 'wait' : 'pointer',
          fontSize: '0.8125rem',
          fontFamily: 'var(--font-ui)',
          fontWeight: 600,
        }}
      >
        {isPending ? 'Regenerating…' : 'Regenerate'}
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
