/**
 * Renders the audit log of gate overrides for an alert. Loaded server-side
 * and passed as a prop so the alert edit page can show "this alert was
 * published over a fact-check chip on 2026-05-14: 'Reddit DP confirms'."
 */
import type { AlertOverrideRow } from '@/utils/supabase/alertOverrides'

interface Props {
  overrides: AlertOverrideRow[]
}

const GATE_LABEL: Record<AlertOverrideRow['gate'], string> = {
  tnc: 'T&Cs',
  factcheck: 'Fact-check',
  voice: 'Voice',
}

export default function AlertOverridesLog({ overrides }: Props) {
  if (overrides.length === 0) return null
  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '0.75rem 0.875rem',
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: 'var(--radius-ui)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#78350F',
          marginBottom: '0.5rem',
        }}
      >
        Override history ({overrides.length})
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'grid',
          gap: '0.5rem',
        }}
      >
        {overrides.map((o) => (
          <li
            key={o.id}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: '#78350F',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 700 }}>{GATE_LABEL[o.gate]}</span> ·{' '}
            <span style={{ color: '#92400E' }}>
              {new Date(o.overridden_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            <div style={{ marginTop: '0.125rem', whiteSpace: 'pre-wrap' }}>{o.reason}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
