/**
 * ChipRow — enforces the v9 4-chip-cap rule.
 *
 * Renders up to maxVisible chips inline; the remainder collapses behind a
 * "more ▾" toggle (purely visual, no overlay). On expand, all chips show.
 *
 * Cognitive load matters — every list row in admin must show "what needs my
 * attention?" not "look how much metadata we have."
 */
'use client'

import { useState, type ReactNode, Children } from 'react'

export function ChipRow({
  children,
  maxVisible = 4,
}: {
  children: ReactNode
  /** Hard cap from v9 plan. Don't raise above 4 without an editorial reason. */
  maxVisible?: number
}) {
  const [expanded, setExpanded] = useState(false)
  // Filter out null/false/undefined children so chips that opted out (e.g.
  // ConfirmationCountChip with count=0) don't count toward the cap.
  const all = Children.toArray(children).filter(Boolean)
  const visible = expanded ? all : all.slice(0, maxVisible)
  const hidden = all.length - visible.length

  return (
    <div
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.375rem',
      }}
    >
      {visible}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 500,
            color: 'var(--admin-text-muted)',
            background: 'transparent',
            border: 'none',
            padding: '0.125rem 0.375rem',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '0.125em',
          }}
        >
          +{hidden} more ▾
        </button>
      )}
      {expanded && all.length > maxVisible && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 500,
            color: 'var(--admin-text-muted)',
            background: 'transparent',
            border: 'none',
            padding: '0.125rem 0.375rem',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '0.125em',
          }}
        >
          show less ▴
        </button>
      )}
    </div>
  )
}
