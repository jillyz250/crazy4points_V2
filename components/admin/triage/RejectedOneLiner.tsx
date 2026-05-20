/**
 * RejectedOneLiner — Phase 1d.4 client component replacing the 1d.3 native
 * <details> implementation.
 *
 * Renders as a single dim strikethrough line. Click the chevron (or anywhere
 * on the row) to expand; click again to collapse.
 */
'use client'

import { useState } from 'react'

export interface RejectedRow {
  id: string
  headline: string
  source_name: string | null
  source_url: string | null
  raw_text: string | null
  rejected_at: string | null
  rejected_reason: string | null
}

// Render preset codes as readable labels; pass through "other:<text>" verbatim
// minus the prefix; show NULL as "(no reason recorded)".
function formatReason(raw: string | null): string {
  if (!raw) return 'no reason recorded'
  if (raw === 'duplicate') return 'duplicate'
  if (raw === 'low-signal') return 'low signal'
  if (raw === 'wrong-program') return 'wrong program'
  if (raw === 'off-brand') return 'off-brand'
  if (raw === 'not-actionable') return 'not actionable'
  if (raw.startsWith('other:')) return raw.slice('other:'.length).trim() || 'other'
  return raw
}

export function RejectedOneLiner({ row }: { row: RejectedRow }) {
  const [open, setOpen] = useState(false)
  const rejectedAt = row.rejected_at
    ? new Date(row.rejected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''
  const reasonLabel = formatReason(row.rejected_reason)

  return (
    <div
      style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius)',
        opacity: 0.7,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '0.5rem 0.75rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--admin-text-muted)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '0.75rem',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 80ms ease',
          }}
        >
          ▸
        </span>
        <span>
          <span style={{ textDecoration: 'line-through' }}>{row.headline}</span>
          {' · '}
          {row.source_name ?? '(unknown)'}
          {rejectedAt ? ` · rejected ${rejectedAt}` : ''}
          {row.rejected_reason ? (
            <span
              style={{
                marginLeft: '0.375rem',
                padding: '0.0625rem 0.375rem',
                background: 'var(--color-chip-red-bg)',
                color: 'var(--color-chip-red-fg)',
                borderRadius: '9999px',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {reasonLabel}
            </span>
          ) : null}
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 0.75rem 0.5rem 1.875rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--admin-text)',
          }}
        >
          {row.raw_text && (
            <p style={{ whiteSpace: 'pre-wrap', margin: '0.25rem 0' }}>{row.raw_text}</p>
          )}
          {row.source_url && (
            <a
              href={row.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--admin-accent)' }}
            >
              source ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}
