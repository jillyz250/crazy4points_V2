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

// Synthetic chip emitted by verifyAlertDraft when a promo-shaped alert's
// body is missing one or more qualifying terms. Format: MISSING_PROMO_TERMS:
// <field, field, …>. Detected here so we can render it as a distinct
// "missing-terms" chip instead of a generic unverifiable claim.
const MISSING_PROMO_PREFIX = 'MISSING_PROMO_TERMS:'

const PROMO_TERM_LABELS: Record<string, string> = {
  earning_window:             'Earning window',
  travel_window:              'Travel / stay window',
  min_spend:                  'Minimum spend',
  min_nights_or_transactions: 'Minimum nights / transactions',
  status_tier:                'Status tier',
  registration:               'Registration',
  exclusions:                 'Exclusions',
}

function parseMissingPromoTerms(claim: string): string[] | null {
  if (!claim.startsWith(MISSING_PROMO_PREFIX)) return null
  const rest = claim.slice(MISSING_PROMO_PREFIX.length).trim()
  if (!rest) return []
  return rest.split(',').map((s) => s.trim()).filter(Boolean)
}

function MissingPromoTermsChip({
  alertId,
  originalIndex,
  fields,
}: {
  alertId: string
  originalIndex: number
  fields: string[]
}) {
  const labels = fields.map((f) => PROMO_TERM_LABELS[f] ?? f)
  const bg = '#fef3c7'
  const border = '#f59e0b'
  const color = '#7a4a0a'
  return (
    <li
      style={{
        padding: '0.5rem 0.625rem',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-ui)',
        color,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '0.1rem 0.4rem',
            background: color,
            color: '#fff',
            borderRadius: '3px',
            flexShrink: 0,
          }}
        >
          ⚠ promo terms
        </span>
        <span style={{ fontWeight: 600, flex: 1, minWidth: '12rem' }}>
          Missing qualifying terms in body — reader can&apos;t tell if they qualify:
        </span>
        <AckButton alertId={alertId} originalIndex={originalIndex} color={color} />
      </div>
      <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, fontSize: '0.8125rem' }}>
        {labels.map((l, i) => (
          <li key={i} style={{ listStyle: 'disc' }}>{l}</li>
        ))}
      </ul>
      <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', fontStyle: 'italic' }}>
        Either revise the draft to surface these from the source, or acknowledge with
        &ldquo;not specified in source&rdquo; in the prose, then mark this verified.
      </p>
    </li>
  )
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

  // Default-collapsed disclosure: shows a one-line summary; click to expand
  // the full claim list. Keeps the pending-review / edit page scannable
  // when an alert has multiple flagged claims.
  const wrong = active.filter(({ claim }) => claim.web_verdict === 'likely_wrong').length
  const unverifiable = active.filter(({ claim }) => claim.web_verdict === 'unverifiable' || !claim.web_verdict).length
  const correct = active.filter(({ claim }) => claim.web_verdict === 'likely_correct').length

  const summaryParts: string[] = []
  if (wrong) summaryParts.push(`${wrong} likely wrong`)
  if (correct) summaryParts.push(`${correct} likely correct`)
  if (unverifiable) summaryParts.push(`${unverifiable} unverifiable`)
  if (dismissed) summaryParts.push(`${dismissed} dismissed`)

  return (
    <details
      id="fact-check"
      open={wrong > 0}
      style={{
        marginTop: '0.5rem',
        background: '#fff8e1',
        border: '1px solid #fde68a',
        borderRadius: 'var(--radius-ui)',
        fontSize: '0.8125rem',
        color: '#5a4210',
      }}
    >
      <summary
        style={{
          padding: '0.5rem 0.75rem',
          cursor: 'pointer',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span>⚠ {active.length} claim{active.length === 1 ? '' : 's'} flagged</span>
        {summaryParts.length > 0 && (
          <span style={{ fontWeight: 400, color: '#7a5a1f' }}>· {summaryParts.join(' · ')}</span>
        )}
      </summary>

      <div style={{ padding: '0 0.75rem 0.625rem' }}>
        {active.length === 0 ? (
          <p style={{ margin: 0, fontStyle: 'italic', color: '#7a5a1f' }}>
            All claims reviewed. ✓
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {active.map(({ claim, originalIndex }) => {
              // Synthetic promo-terms chip — render as distinct "missing terms" block.
              const missingFields = parseMissingPromoTerms(claim.claim)
              if (missingFields !== null) {
                return (
                  <MissingPromoTermsChip
                    key={originalIndex}
                    alertId={alertId}
                    originalIndex={originalIndex}
                    fields={missingFields}
                  />
                )
              }
              const v = verdictStyle(claim.web_verdict)
              const hasEvidence = Boolean(claim.web_evidence || claim.web_url)
              return (
                <li
                  key={originalIndex}
                  style={{
                    padding: '0.4rem 0.55rem',
                    background: v.bg,
                    border: `1px solid ${v.border}`,
                    borderRadius: 'var(--radius-ui)',
                    color: v.color,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '0.05rem 0.35rem',
                      background: v.color,
                      color: '#fff',
                      borderRadius: '3px',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}>
                      {v.label}
                    </span>
                    <span style={{ fontWeight: 500, flex: 1, minWidth: '10rem', lineHeight: 1.4 }}>{claim.claim}</span>
                    <AckButton
                      alertId={alertId}
                      originalIndex={originalIndex}
                      color={v.color}
                    />
                  </div>
                  {hasEvidence && (
                    <details style={{ marginTop: '0.3rem', fontSize: '0.75rem' }}>
                      <summary style={{ cursor: 'pointer', color: v.color, opacity: 0.85 }}>
                        evidence
                      </summary>
                      {claim.web_evidence && (
                        <p style={{ margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                          {claim.web_evidence}
                        </p>
                      )}
                      {claim.web_url && (
                        <a
                          href={claim.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'block', marginTop: '0.2rem', color: v.color, textDecoration: 'underline', wordBreak: 'break-all' }}
                        >
                          {claim.web_url}
                        </a>
                      )}
                    </details>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </details>
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
