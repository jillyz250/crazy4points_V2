'use client'

import { useTransition } from 'react'
import { acknowledgeFactCheckClaimAction } from '@/app/admin/(protected)/alerts/actions'

// Mirrors VerifyClaim from utils/ai/verifyAlertDraft.ts. Duplicated here so
// this client component doesn't pull the server-only Anthropic SDK import.
// `supported` is the three-state model from the verifier:
//   true          — source explicitly confirms
//   false         — source explicitly contradicts
//   'unsupported' — source is silent / can't verify
interface Claim {
  claim: string
  supported: boolean | 'unsupported'
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
  // Standard promo types (limited_time_offer, transfer_bonus, status_promo, award_availability)
  earning_window:             'Earning window',
  travel_window:              'Travel / stay window',
  min_spend:                  'Minimum spend',
  min_nights_or_transactions: 'Minimum nights / transactions',
  status_tier:                'Status tier',
  registration:               'Registration',
  exclusions:                 'Exclusions',
  // Buy-miles type (point_purchase)
  bonus_tier_structure:       'Bonus tier structure',
  min_purchase:               'Minimum purchase',
  annual_cap:                 'Annual cap',
  sub_period_cap:             '90-day / sub-period cap',
  purchase_window:            'Purchase window',
  posting_timeline:           'Posting timeline',
  targeted_vs_public:         'Targeted vs public',
  cpm_math:                   'CPM (pre-tax / all-in)',
  refundability:              'Refundability',
  historical_context:         'Historical context (last sale / best ever)',
  payment_routing:            'Payment routing (Points.com vs travel)',
}

const OFF_BRAND_VOICE_PREFIX = 'OFF_BRAND_VOICE'
const MATH_CHECK_PREFIX = 'MATH_CHECK:'

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
        These fields look silently omitted (not in the description, not flagged
        by the writer in gaps_acknowledged). Either fill them via the gap-fill
        banner above the description and regenerate, or mark verified to dismiss.
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
  // "Unsupported" here = anything that isn't positively confirmed. The
  // verifier uses a three-state truth model (true | false | 'unsupported'),
  // so a naive `!claim.supported` filter misses the 'unsupported' string
  // (which is truthy) and silently hides the whole chip list.
  const indexed = claims.map((c, i) => ({ claim: c, originalIndex: i }))
  const unsupported = indexed.filter(({ claim }) => claim.supported !== true)
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
              // Synthetic OFF_BRAND_VOICE chip — distinct purple chip.
              if (claim.claim.startsWith(OFF_BRAND_VOICE_PREFIX)) {
                return (
                  <SyntheticChip
                    key={originalIndex}
                    alertId={alertId}
                    originalIndex={originalIndex}
                    label="off-brand voice"
                    bg="#f3e8ff"
                    border="#a855f7"
                    color="#581c87"
                    body={claim.claim.slice(OFF_BRAND_VOICE_PREFIX.length).replace(/^[\s:]+/, '')}
                    helper="Tighten the voice (sassy + funny per BRAND_VOICE), or acknowledge if intentional, then mark verified."
                  />
                )
              }
              // Synthetic MATH_CHECK chip — distinct blue chip.
              if (claim.claim.startsWith(MATH_CHECK_PREFIX)) {
                return (
                  <SyntheticChip
                    key={originalIndex}
                    alertId={alertId}
                    originalIndex={originalIndex}
                    label="math check"
                    bg="#dbeafe"
                    border="#3b82f6"
                    color="#1e3a8a"
                    body={claim.claim.slice(MATH_CHECK_PREFIX.length).trim()}
                    helper="Recompute CPM against the program's base price + tax. Add a pre-tax / all-in label or fix the number, then mark verified."
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
                    <FindInDescriptionButton claim={claim.claim} color={v.color} />
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

// Generic synthetic-chip renderer for OFF_BRAND_VOICE and MATH_CHECK claims.
// Shape mirrors MissingPromoTermsChip but caller picks the colors + copy.
function SyntheticChip({
  alertId,
  originalIndex,
  label,
  bg,
  border,
  color,
  body,
  helper,
}: {
  alertId: string
  originalIndex: number
  label: string
  bg: string
  border: string
  color: string
  body: string
  helper: string
}) {
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
          ⚠ {label}
        </span>
        <span style={{ fontWeight: 600, flex: 1, minWidth: '12rem', lineHeight: 1.4 }}>{body}</span>
        <AckButton alertId={alertId} originalIndex={originalIndex} color={color} />
      </div>
      <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', fontStyle: 'italic' }}>
        {helper}
      </p>
    </li>
  )
}

// "Find in description" — locates a fragment of the flagged claim in the
// description textarea, scrolls it into view, and selects it so the admin
// can edit or strip immediately. Falls back to progressively shorter
// fragments (first N words) when the full claim text isn't a literal match.
function findClaimRangeInTextarea(
  textarea: HTMLTextAreaElement,
  claim: string,
): { start: number; end: number } | null {
  const haystack = textarea.value.toLowerCase()
  const tryNeedle = (needle: string): { start: number; end: number } | null => {
    const n = needle.trim().toLowerCase()
    if (n.length < 4) return null
    const idx = haystack.indexOf(n)
    if (idx === -1) return null
    return { start: idx, end: idx + n.length }
  }
  const direct = tryNeedle(claim)
  if (direct) return direct
  // Drop trailing punctuation (verifier sometimes adds " — likely wrong")
  const stripped = claim.replace(/[—:–-].*$/, '').trim()
  if (stripped !== claim) {
    const r = tryNeedle(stripped)
    if (r) return r
  }
  // Progressive shrink: 12, 8, 5 leading words
  const words = stripped.split(/\s+/).filter(Boolean)
  for (const n of [12, 8, 5]) {
    if (words.length < n) continue
    const r = tryNeedle(words.slice(0, n).join(' '))
    if (r) return r
  }
  return null
}

function FindInDescriptionButton({ claim, color }: { claim: string; color: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const ta = document.querySelector(
          'textarea[name="description"]',
        ) as HTMLTextAreaElement | null
        if (!ta) return
        const range = findClaimRangeInTextarea(ta, claim)
        ta.focus()
        if (range) {
          ta.setSelectionRange(range.start, range.end)
        }
        ta.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Brief outline flash so the user can see where it landed even on
        // viewports where the selection isn't visually distinct.
        const prev = ta.style.outline
        ta.style.outline = `2px solid ${color}`
        ta.style.outlineOffset = '2px'
        window.setTimeout(() => {
          ta.style.outline = prev
        }, 1200)
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
        cursor: 'pointer',
        flexShrink: 0,
      }}
      title="Scroll to and highlight this claim in the description"
    >
      🔍 Find
    </button>
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
