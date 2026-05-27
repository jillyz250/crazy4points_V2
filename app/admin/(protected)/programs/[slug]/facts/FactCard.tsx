'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { setDisposition, type SetDispositionResult } from './actions'

type Fact = {
  id: string
  program_slug: string
  claim_text: string
  category: string | null
  verdict: 'verified' | 'needs_clarification' | 'incorrect'
  risk_level: 'high' | 'medium' | 'low'
  sources: Array<{ url: string; publication_date: string | null; snippet: string | null; is_official?: boolean; why_chosen?: string }>
  third_party_fallback: boolean
  disposition: string | null
  override_reason: string | null
  reviewed_at: string
  reviewed_by: string | null
}

const VERDICT_LABEL: Record<Fact['verdict'], string> = {
  verified: 'Verified',
  needs_clarification: 'Needs clarification',
  incorrect: 'Incorrect',
}
const VERDICT_TONE: Record<Fact['verdict'], string> = {
  verified: 'tone-success',
  needs_clarification: 'tone-warning',
  incorrect: 'tone-danger',
}
const RISK_TONE: Record<Fact['risk_level'], string> = {
  high: 'tone-danger',
  medium: 'tone-warning',
  low: 'tone-neutral',
}
const DISPOSITION_OPTIONS = [
  { value: 'auto_locked', label: 'Auto-locked' },
  { value: 'kept', label: 'Kept (despite verdict)' },
  { value: 'reworded', label: 'Reworded' },
  { value: 'removed', label: 'Removed' },
  { value: 'deferred', label: 'Deferred' },
] as const

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const BADGE_BG: Record<string, string> = {
  'tone-success': 'rgba(46, 125, 50, 0.12)',
  'tone-warning': 'rgba(245, 158, 11, 0.12)',
  'tone-danger': 'rgba(185, 28, 28, 0.12)',
  'tone-neutral': 'rgba(0, 0, 0, 0.06)',
}
const BADGE_FG: Record<string, string> = {
  'tone-success': '#2e7d32',
  'tone-warning': '#c47a00',
  'tone-danger': '#b91c1c',
  'tone-neutral': '#444',
}

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: BADGE_BG[tone] ?? BADGE_BG['tone-neutral'],
        color: BADGE_FG[tone] ?? BADGE_FG['tone-neutral'],
      }}
    >
      {children}
    </span>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="admin-btn admin-btn-primary admin-btn-sm"
      style={{ fontSize: '0.75rem' }}
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

const FIELD_LABEL: Record<string, string> = {
  intro: 'Intro',
  sweet_spots: 'Sweet spots',
  quirks: 'Quirks',
  how_to_spend: 'How to spend',
  lounge_access: 'Lounge access',
  tier_benefits: 'Tier benefits',
  award_chart: 'Award chart',
}

export default function FactCard({ fact, linkedFields = [] }: { fact: Fact; linkedFields?: string[] }) {
  const [state, formAction] = useActionState<SetDispositionResult, FormData>(setDisposition, null)
  const [showReason, setShowReason] = useState(!!fact.override_reason)
  const isTriaged = !!fact.disposition && fact.disposition !== 'auto_locked'
  const savedRecently =
    state?.ok && Date.now() - new Date(state.savedAt).getTime() < 4000

  return (
    <div
      style={{
        border: '1px solid var(--admin-border)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        background: 'var(--admin-surface, #fff)',
        opacity: isTriaged ? 0.6 : 1,
        position: 'relative',
        transition: 'opacity 0.2s',
      }}
    >
      {isTriaged && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            fontSize: '0.6875rem',
            color: 'var(--admin-text-muted)',
            background: 'rgba(0,0,0,0.04)',
            padding: '0.125rem 0.5rem',
            borderRadius: '9999px',
          }}
        >
          ✓ triaged
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
        <Pill tone={VERDICT_TONE[fact.verdict]}>{VERDICT_LABEL[fact.verdict]}</Pill>
        <Pill tone={RISK_TONE[fact.risk_level]}>{fact.risk_level}</Pill>
        {fact.category && <Pill tone="tone-neutral">{fact.category}</Pill>}
        {fact.third_party_fallback && <Pill tone="tone-warning">third-party fallback</Pill>}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
          Last verified {formatAge(fact.reviewed_at)}
          {fact.reviewed_by && <> · by {fact.reviewed_by}</>}
        </span>
      </div>

      {linkedFields.length > 0 ? (
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.375rem', fontSize: '0.6875rem', color: 'var(--admin-text-muted)' }}>
          <span style={{ marginRight: '0.25rem' }}>🔗 Cited in:</span>
          {linkedFields.map((f) => (
            <span
              key={f}
              style={{
                padding: '0.0625rem 0.375rem',
                background: 'rgba(46, 125, 50, 0.08)',
                borderRadius: '9999px',
                color: '#2e7d32',
                fontWeight: 600,
              }}
            >
              {FIELD_LABEL[f] ?? f}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: '0.375rem', fontSize: '0.6875rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
          ⚪ Orphaned — not currently cited in any prose paragraph
        </div>
      )}

      <div style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>{fact.claim_text}</div>

      {fact.sources.length > 0 && (
        <details>
          <summary style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
            Sources ({fact.sources.length})
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
            {fact.sources.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: '0.25rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  {s.is_official && <Pill tone="tone-success">official</Pill>}
                  <a href={s.url} target="_blank" rel="noopener" style={{ color: 'var(--admin-link, #2563eb)', wordBreak: 'break-all' }}>
                    {s.url}
                  </a>
                  {s.publication_date && (
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>
                      ({s.publication_date})
                    </span>
                  )}
                </div>
                {s.snippet && <div style={{ marginTop: '0.25rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>&ldquo;{s.snippet}&rdquo;</div>}
              </div>
            ))}
          </div>
        </details>
      )}

      <form action={formAction} style={{ marginTop: '0.75rem' }}>
        <input type="hidden" name="id" value={fact.id} />

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Disposition:</label>
          <select
            name="disposition"
            defaultValue={fact.disposition ?? ''}
            style={{ fontSize: '0.8125rem', padding: '0.25rem 0.375rem', border: '1px solid var(--admin-border)', borderRadius: '0.25rem' }}
          >
            <option value="">— none —</option>
            {DISPOSITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowReason((s) => !s)}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            style={{ fontSize: '0.75rem' }}
          >
            {showReason ? '− Hide reason' : '+ Add reason'}
          </button>

          <SaveButton />

          {savedRecently && (
            <span style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
          {state?.ok === false && (
            <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
              ✗ {state.error}
            </span>
          )}

          <details style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--admin-text-muted)' }}>Re-verify CLI</summary>
            <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', margin: '0.25rem 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {`node scripts/factcheck-program.mjs --fact-id=${fact.id}`}
            </pre>
          </details>
        </div>

        {showReason && (
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Override reason (why kept / reworded / removed despite verdict):
            </label>
            <textarea
              name="override_reason"
              defaultValue={fact.override_reason ?? ''}
              rows={2}
              placeholder="e.g. Verified manually on hilton.com 2026-05-26; script source-match was unrelated."
              style={{
                width: '100%',
                fontSize: '0.8125rem',
                padding: '0.375rem 0.5rem',
                border: '1px solid var(--admin-border)',
                borderRadius: '0.25rem',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {fact.override_reason && !showReason && (
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '0.375rem', fontStyle: 'italic' }}>
            Reason: {fact.override_reason}
          </div>
        )}
      </form>
    </div>
  )
}
