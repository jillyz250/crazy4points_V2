'use client'

import { useState, useTransition } from 'react'
import { rewriteFromVerifiedFactsAction } from '@/app/admin/(protected)/content-ideas/actions'

interface Props {
  ideaId: string
  factChecked: boolean
  verifiedCount: number
  flaggedCount: number
}

/**
 * Button shown after fact-check has run. Calls the rewrite action which
 * uses ONLY verified-correct claims as the writer's allowed facts.
 *
 * Disabled when:
 *   - fact-check hasn't run yet
 *   - there are fewer than 2 verified claims (too thin to rewrite from)
 *   - there are 0 flagged claims (nothing to fix; rewrite would just be
 *     a do-over with the same facts)
 */
export default function RewriteFromVerifiedFactsButton({
  ideaId,
  factChecked,
  verifiedCount,
  flaggedCount,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const disabledReason = !factChecked
    ? 'Run fact check first'
    : verifiedCount < 2
      ? `Only ${verifiedCount} verified — too thin`
      : flaggedCount === 0
        ? 'No flagged claims to fix'
        : null

  const onClick = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await rewriteFromVerifiedFactsAction(ideaId)
      if (res.ok) {
        setSuccess(
          `Rewritten using ${res.verified_count} verified facts. ` +
            `Body: ${res.old_length.toLocaleString()} → ${res.new_length.toLocaleString()} chars. ` +
            `Re-run fact check to confirm.`
        )
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={isPending || !!disabledReason}
        title={disabledReason ?? 'Drop flagged claims; rewrite using only verified facts'}
        className={`admin-btn admin-btn-sm ${
          disabledReason ? 'admin-btn-ghost' : 'admin-btn-primary'
        }`}
      >
        {isPending ? 'Rewriting…' : '🔁 Rewrite from verified facts'}
        {!disabledReason && flaggedCount > 0 && (
          <span style={{ marginLeft: '0.375rem', opacity: 0.85, fontSize: '0.6875rem' }}>
            (drops {flaggedCount})
          </span>
        )}
      </button>
      {error && (
        <span
          style={{
            fontSize: '0.6875rem',
            color: '#b91c1c',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            padding: '0.1875rem 0.4375rem',
            borderRadius: '999px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            maxWidth: '24rem',
          }}
        >
          {error}
        </span>
      )}
      {success && (
        <span
          style={{
            fontSize: '0.6875rem',
            color: '#15803d',
            background: '#dcfce7',
            border: '1px solid #86efac',
            padding: '0.1875rem 0.4375rem',
            borderRadius: '999px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            maxWidth: '24rem',
          }}
        >
          ✓ {success}
        </span>
      )}
    </span>
  )
}
