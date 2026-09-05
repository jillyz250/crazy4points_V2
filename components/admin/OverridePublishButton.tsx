'use client'

import { useState, useTransition } from 'react'
import type { GateReport } from '@/utils/alerts/publishGates'
import type { OverrideGate } from '@/utils/supabase/alertOverrides'

interface Props {
  alertId: string
  gates: GateReport
  /** Server action that takes alertId + override array, logs reasons, publishes. */
  action: (
    alertId: string,
    overrides: Array<{ gate: OverrideGate; reason: string }>
  ) => Promise<void>
}

/**
 * Render-only when gates.canPublish is false. Lets admin bypass each failing
 * gate by writing a reason — each override is audit-logged in alert_overrides
 * before publish. No reason field => button stays disabled for that gate.
 */
export default function OverridePublishButton({ alertId, gates, action }: Props) {
  const [open, setOpen] = useState(false)
  const [reasons, setReasons] = useState<Record<OverrideGate, string>>({
    tnc: '',
    factcheck: '',
    voice: '',
    source: '',
    legal: '',
  })
  const [submitting, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const failingGates: OverrideGate[] = []
  if (gates.tnc === 'fail') failingGates.push('tnc')
  if (gates.factcheck === 'fail') failingGates.push('factcheck')
  if (gates.voice === 'fail') failingGates.push('voice')
  if (gates.source === 'fail') failingGates.push('source')
  if (gates.legal === 'fail') failingGates.push('legal')

  if (gates.canPublish || failingGates.length === 0) return null

  const allFilled = failingGates.every((g) => reasons[g].trim().length > 0)

  function submit() {
    setError(null)
    const overrides = failingGates.map((g) => ({ gate: g, reason: reasons[g].trim() }))
    startTransition(async () => {
      try {
        await action(alertId, overrides)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Override failed')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-btn admin-btn-secondary admin-btn-sm"
      >
        Override &amp; Publish…
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div
            style={{
              background: 'var(--admin-bg, #fff)',
              borderRadius: 'var(--radius-card)',
              padding: '1.5rem',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.125rem' }}>
              Override &amp; Publish
            </h3>
            <p
              style={{
                marginTop: 0,
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--admin-text-muted)',
                lineHeight: 1.5,
              }}
            >
              Each bypass is audit-logged with the reason you provide. Be specific —
              future-you will thank present-you.
            </p>
            {failingGates.map((g) => (
              <div key={g} style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor={`reason-${g}`}
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    marginBottom: '0.375rem',
                  }}
                >
                  {g === 'tnc'
                    ? 'T&Cs override reason'
                    : g === 'factcheck'
                    ? 'Fact-check override reason'
                    : g === 'source'
                    ? 'Source override reason'
                    : g === 'legal'
                    ? 'Legal disclosure override reason'
                    : 'Voice override reason'}
                </label>
                <textarea
                  id={`reason-${g}`}
                  rows={2}
                  value={reasons[g]}
                  onChange={(e) =>
                    setReasons((prev) => ({ ...prev, [g]: e.target.value }))
                  }
                  placeholder={
                    g === 'tnc'
                      ? 'e.g. Developing — official terms not yet public; sourced from carrier press release'
                      : g === 'factcheck'
                      ? 'e.g. Flagged claim about XP earning is confirmed via second source (Reddit DP)'
                      : g === 'source'
                      ? 'e.g. Confirmed live on the issuer site today; blog link kept for the write-up'
                      : g === 'legal'
                      ? 'e.g. Charlie reviewed; general points-news item, no financial-advice framing'
                      : 'e.g. Voice gate flagged "the headline X" — read draft, fine for context'
                  }
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.625rem',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-ui)',
                    border: '1px solid var(--admin-border, #D1D5DB)',
                    resize: 'vertical',
                  }}
                />
              </div>
            ))}
            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: '1rem',
                  padding: '0.625rem 0.75rem',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-ui)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  color: '#7F1D1D',
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!allFilled || submitting}
                className="admin-btn admin-btn-primary admin-btn-sm"
              >
                {submitting ? 'Publishing…' : 'Log overrides & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
