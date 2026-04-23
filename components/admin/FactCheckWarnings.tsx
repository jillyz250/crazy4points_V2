'use client'

import { useTransition } from 'react'
import { acknowledgeFactCheckClaimAction } from '@/app/admin/(protected)/alerts/actions'

// Mirrors VerifyClaim from utils/ai/verifyAlertDraft.ts. Duplicated here so
// this client component doesn't pull the server-only Anthropic SDK import.
interface Claim {
  claim: string
  supported: boolean
  severity: string
  source_excerpt: string | null
  web_verdict?: 'likely_correct' | 'likely_wrong' | 'unverifiable' | null
  web_evidence?: string | null
  web_url?: string | null
  acknowledged?: boolean
}

function verdictStyle(v?: string | null) {
  if (v === 'likely_correct') return { bg: '#e6f4ea', border: '#9ac4a7', color: '#1e5c2e', label: '✓ likely correct' }
  if (v === 'likely_wrong') return { bg: '#fdecea', border: '#f5c6cb', color: '#7a1f1f', label: '✗ likely wrong' }
  return { bg: '#fff8e1', border: '#fde68a', color: '#7a5a1f', label: '? unverifiable' }
}

export default function FactCheckWarnings({
  alertId,
  claims: rawClaims,
}: {
  alertId: string
  claims: unknown
}) {
  const claims: Claim[] = Array.isArray(rawClaims) ? (rawClaims as Claim[]) : []
  // Each claim keeps its original index so the server action can target it
  // even after we filter out acknowledged ones.
  const indexed = claims.map((c, i) => ({ claim: c, originalIndex: i }))
  const unsupported = indexed.filter(({ claim }) => !claim.supported)
  const active = unsupported.filter(({ claim }) => !claim.acknowledged)
  const dismissed = unsupported.filter(({ claim }) => claim.acknowledged).length

  if (unsupported.length === 0) return null

  return (
    <div id="fact-check" style={{
      marginTop: '0.625rem',
      padding: '0.625rem 0.75rem',
      background: '#fff8e1',
      border: '1px solid #fde68a',
      borderRadius: 'var(--radius-ui)',
      fontSize: '0.8125rem',
      color: '#5a4210',
    }}>
      <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
        Claims not found in source ({active.length} open{dismissed > 0 ? ` · ${dismissed} dismissed` : ''}):
      </p>
      {active.length === 0 ? (
        <p style={{ margin: 0, fontStyle: 'italic', color: '#7a5a1f' }}>
          All claims reviewed. ✓
        </p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {active.map(({ claim, originalIndex }) => {
            const v = verdictStyle(claim.web_verdict)
            return (
              <li
                key={originalIndex}
                style={{
                  padding: '0.5rem 0.625rem',
                  background: v.bg,
                  border: `1px solid ${v.border}`,
                  borderRadius: 'var(--radius-ui)',
                  color: v.color,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '0.1rem 0.4rem',
                    background: v.color,
                    color: '#fff',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}>
                    {v.label}
                  </span>
                  <span style={{ fontWeight: 600, flex: 1, minWidth: '12rem' }}>{claim.claim}</span>
                  <AckButton
                    alertId={alertId}
                    originalIndex={originalIndex}
                    color={v.color}
                  />
                </div>
                {claim.web_evidence && (
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    {claim.web_evidence}
                  </p>
                )}
                {claim.web_url && (
                  <a
                    href={claim.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: v.color, textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    {claim.web_url}
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Inner button can't live inside a <form> because FactCheckWarnings itself
// is rendered inside the EditAlertForm's outer <form>. Browsers disallow
// nested forms — HTML parsing would strip the inner one and clicks would
// submit the outer "Save Changes" form. Call the server action directly.
function AckButton({
  alertId,
  originalIndex,
  color,
}: {
  alertId: string
  originalIndex: number
  color: string
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await acknowledgeFactCheckClaimAction(alertId, originalIndex)
        })
      }}
      style={{
        fontSize: '0.6875rem',
        fontFamily: 'var(--font-ui)',
        fontWeight: 600,
        padding: '0.15rem 0.5rem',
        background: '#fff',
        border: `1px solid ${color}`,
        color,
        borderRadius: '3px',
        cursor: isPending ? 'wait' : 'pointer',
        flexShrink: 0,
        opacity: isPending ? 0.6 : 1,
      }}
      title="Mark as confirmed by you"
    >
      {isPending ? '…saving' : '✓ Mark verified'}
    </button>
  )
}
