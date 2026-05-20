/**
 * ProvenancePanel — inline accordion showing the full timeline of an
 * intel_item (or content_variant later).
 *
 * v9 plan: "inline accordion below the row, not modal. Same pattern on mobile."
 *
 * This is a presentation component — caller fetches the data shape and
 * passes it in. Keeps the component pure + reusable on any page.
 */
'use client'

import { useState, type ReactNode } from 'react'

export interface ProvenanceEvent {
  occurred_at: string | Date
  actor: string | null
  description: string
}

export interface ProvenanceData {
  source_name: string
  source_url?: string | null
  confidence?: 'high' | 'medium' | 'low' | null
  fact_origin?:
    | 'official'
    | 'secondary'
    | 'social-rumor'
    | 'inferred'
    | 'ai-discovered-only'
    | null
  arrived_at: string | Date
  confirmation_count?: number | null
  confirming_sources?: string[] | null
  surface_locations?: string[] | null
  timeline?: ProvenanceEvent[]
  haiku_diff_summary?: string | null
}

export function ProvenancePanel({
  data,
  defaultOpen = false,
  trigger,
}: {
  data: ProvenanceData
  defaultOpen?: boolean
  /** Custom trigger label/button. Defaults to "Provenance ▾" / "Provenance ▴". */
  trigger?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const arrived =
    typeof data.arrived_at === 'string' ? new Date(data.arrived_at) : data.arrived_at

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: 'var(--admin-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 500,
          cursor: 'pointer',
          textDecoration: 'underline',
          textUnderlineOffset: '0.125em',
        }}
      >
        {trigger ?? `Provenance ${open ? '▴' : '▾'}`}
      </button>
      {open && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.875rem 1rem',
            background: 'var(--admin-surface-alt)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--admin-text)',
            lineHeight: 1.5,
          }}
        >
          <Row label="Arrived from">
            {data.source_name}
            {data.source_url ? (
              <>
                {' '}
                ·{' '}
                <a
                  href={data.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--admin-accent)' }}
                >
                  source link ↗
                </a>
              </>
            ) : null}
          </Row>
          {data.confidence && <Row label="Source confidence">{data.confidence}</Row>}
          {data.fact_origin && <Row label="Fact origin">{data.fact_origin}</Row>}
          <Row label="Arrived at">
            {arrived.toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </Row>
          {data.haiku_diff_summary && (
            <Row label="What changed (Haiku diff)">{data.haiku_diff_summary}</Row>
          )}
          {data.confirmation_count && data.confirmation_count > 0 && (
            <Row label={`+${data.confirmation_count} later confirmations`}>
              {(data.confirming_sources ?? []).join(', ') || '(no source names recorded)'}
            </Row>
          )}
          {data.surface_locations && data.surface_locations.length > 0 && (
            <Row label="Currently live on">{data.surface_locations.join(', ')}</Row>
          )}
          {data.timeline && data.timeline.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--admin-text-muted)',
                  letterSpacing: '0.05em',
                  marginBottom: '0.375rem',
                }}
              >
                Timeline
              </div>
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {data.timeline.map((ev, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>
                      {new Date(ev.occurred_at).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                      {ev.actor ? ` · ${ev.actor}` : ''}
                    </span>
                    {' — '}
                    {ev.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
      <span
        style={{
          flexShrink: 0,
          minWidth: '11rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--admin-text-muted)',
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  )
}
