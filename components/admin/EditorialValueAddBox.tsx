/**
 * Admin-only QC box showing the writer's claimed editorial value-add
 * beyond raw_text. Surfaces on /admin/alerts/[id]/edit; never reaches
 * the public alert page.
 *
 * Purpose: 3-second self-audit per draft — did the writer earn its
 * keep, or just paraphrase the press release? If the items here are
 * fluffy or empty, regenerate / hand-edit.
 *
 * Bound on the writer side by NO FABRICATION + NO PLAGIARISM rules
 * (utils/ai/writeAlertDraft.ts). Empty array means the writer couldn't
 * identify any genuine value-add — that's a signal to act.
 */

interface ValueAddItem {
  label: string
  evidence: string
}

interface Props {
  items: unknown
}

function parseItems(raw: unknown): ValueAddItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is { label?: unknown; evidence?: unknown } =>
      item != null && typeof item === 'object',
    )
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label.trim() : '',
      evidence: typeof item.evidence === 'string' ? item.evidence.trim() : '',
    }))
    .filter((item) => item.label.length > 0 && item.evidence.length > 0)
}

export default function EditorialValueAddBox({ items }: Props) {
  const parsed = parseItems(items)

  return (
    <aside
      style={{
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        padding: '1.25rem 1.5rem',
        borderLeft: '4px solid #D4AF37',
        background: '#FBF6E5',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#8a6c00',
          }}
        >
          Editorial value-add
        </span>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '11px',
            color: '#8a6c00',
            opacity: 0.7,
          }}
        >
          admin-only · QC log of what the writer added beyond raw source
        </span>
      </header>

      {parsed.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: '#8a6c00',
            fontStyle: 'italic',
          }}
        >
          No editorial value-add reported by the writer. The draft may be a
          press-release paraphrase — consider regenerating or hand-editing.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {parsed.map((item, i) => (
            <li key={i}>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'var(--admin-text)',
                  marginBottom: '0.25rem',
                }}
              >
                • {item.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  color: 'var(--admin-text-muted)',
                  paddingLeft: '0.875rem',
                  fontStyle: 'italic',
                }}
              >
                Not in source: {item.evidence}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
