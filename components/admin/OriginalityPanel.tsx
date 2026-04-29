'use client'

import { useState, useTransition } from 'react'
import {
  rewriteForOriginalityAction,
  type RewriteForOriginalityResult,
} from '@/app/admin/(protected)/content-ideas/actions'

interface FlaggedPassage {
  text: string
  matched_url: string | null
  matched_excerpt: string | null
  confidence: number
  why: string
}

interface Props {
  ideaId: string
  confidenceScore: number | null
  threshold: number | null
  pass: boolean | null
  notes: string | null
  flaggedPassages: FlaggedPassage[]
}

/**
 * Phase 5 originality panel — shows the confidence score, the flagged
 * passages with their matched URLs, and a "Rewrite flagged passages"
 * button that triggers a surgical rephrase of just the flagged content
 * (preserving facts and brand voice).
 *
 * Only renders when there's something interesting to surface — score
 * below threshold OR any flagged passages OR explicit fail. Articles
 * that pass cleanly with no flags are quiet.
 */
export default function OriginalityPanel({
  ideaId,
  confidenceScore,
  threshold,
  pass,
  notes,
  flaggedPassages,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<RewriteForOriginalityResult | null>(null)

  const hasScore = typeof confidenceScore === 'number'
  const effectiveThreshold = threshold ?? 70
  const hasFlags = flaggedPassages.length > 0
  const isFail = pass === false || (hasScore && confidenceScore! < effectiveThreshold)

  // Don't render the panel if nothing interesting to surface — clean
  // pass with no flags is a quiet win and shouldn't take screen space.
  if (!hasFlags && !isFail) return null

  const tone = isFail
    ? { bg: '#fef2f2', border: '#fca5a5', fg: '#b91c1c', label: '✗ Fail' }
    : { bg: '#fffbeb', border: '#fcd34d', fg: '#92400e', label: '⚠ Review' }

  function handleRewrite() {
    if (!hasFlags) return
    if (!confirm(`Rewrite ${flaggedPassages.length} flagged passage${flaggedPassages.length === 1 ? '' : 's'}? This will replace the article body and clear fact-check / voice / originality verdicts so you can re-run them on the new draft.`)) {
      return
    }
    setResult(null)
    startTransition(async () => {
      const res = await rewriteForOriginalityAction(ideaId)
      setResult(res)
    })
  }

  return (
    <details
      open={isFail}
      style={{
        margin: '0 0 0.75rem',
        padding: '0.5rem 0.625rem',
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: 'var(--admin-radius)',
        fontSize: '0.8125rem',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 600,
          color: tone.fg,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span>Originality {tone.label}</span>
        {hasScore && (
          <span
            style={{
              fontWeight: 700,
              padding: '0 0.5rem',
              borderRadius: '999px',
              background: 'rgba(0,0,0,0.06)',
              fontSize: '0.75rem',
            }}
          >
            {confidenceScore}/100 · threshold {effectiveThreshold}
          </span>
        )}
        {hasFlags && (
          <span style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.85 }}>
            {flaggedPassages.length} flagged passage{flaggedPassages.length === 1 ? '' : 's'}
          </span>
        )}
      </summary>

      {notes && (
        <p style={{ margin: '0.5rem 0 0', color: tone.fg, fontStyle: 'italic' }}>{notes}</p>
      )}

      {hasFlags && (
        <ul style={{ margin: '0.625rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {flaggedPassages.map((p, i) => (
            <li
              key={i}
              style={{
                padding: '0.5rem 0.625rem',
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius)',
                fontSize: '0.75rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
                <strong style={{ color: tone.fg }}>Passage {i + 1}</strong>
                <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-muted)' }}>
                  {p.confidence}/100 confidence
                </span>
              </div>
              <p style={{ margin: '0.25rem 0', fontWeight: 500 }}>“{p.text}”</p>
              {p.why && (
                <p style={{ margin: '0.25rem 0', fontStyle: 'italic', color: 'var(--admin-text-muted)' }}>
                  Why: {p.why}
                </p>
              )}
              {p.matched_url && (
                <p style={{ margin: '0.25rem 0' }}>
                  <a
                    href={p.matched_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--admin-accent)', wordBreak: 'break-all' }}
                  >
                    ↗ Matched source
                  </a>
                </p>
              )}
              {p.matched_excerpt && (
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    padding: '0.25rem 0.375rem',
                    background: 'var(--admin-surface-alt)',
                    borderLeft: '2px solid var(--admin-border)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.6875rem',
                  }}
                >
                  {p.matched_excerpt}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasFlags && (
        <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRewrite}
            disabled={pending}
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            {pending ? 'Rewriting…' : `Rewrite ${flaggedPassages.length} flagged passage${flaggedPassages.length === 1 ? '' : 's'}`}
          </button>
          <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-muted)' }}>
            Surgical rephrase. Facts preserved. Re-run fact-check + voice + originality after.
          </span>
        </div>
      )}

      {result && result.ok && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.625rem',
            background: 'var(--admin-success-soft, #e6f4ea)',
            border: '1px solid var(--admin-success)',
            color: 'var(--admin-success)',
            borderRadius: 'var(--admin-radius)',
            fontSize: '0.75rem',
          }}
        >
          ✓ Rewrote {result.changes_count} passage{result.changes_count === 1 ? '' : 's'}.
          Reload to see the new body and re-run checks.
        </div>
      )}
      {result && !result.ok && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.625rem',
            background: 'var(--admin-danger-soft, #fdecea)',
            border: '1px solid var(--admin-danger)',
            color: 'var(--admin-danger)',
            borderRadius: 'var(--admin-radius)',
            fontSize: '0.75rem',
          }}
        >
          {result.error}
        </div>
      )}
    </details>
  )
}
