/**
 * Three-gate status row for the alert edit page (writer redesign).
 * Renders T&Cs · Fact-check · Voice as colored badges so the editor can
 * see at a glance what's blocking publish. Pairs with OverridePublishButton
 * for the explicit-bypass path.
 */
import { Badge } from '@/components/admin/ui/Badge'
import type { GateReport, GateStatus } from '@/utils/alerts/publishGates'

interface Props {
  gates: GateReport
}

const TONE: Record<GateStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  pass: 'success',
  overridden: 'warning',
  fail: 'danger',
  'not-applicable': 'neutral',
}

const ICON: Record<GateStatus, string> = {
  pass: '✓',
  overridden: '⚠',
  fail: '✗',
  'not-applicable': '—',
}

const LABEL: Record<GateStatus, string> = {
  pass: 'Pass',
  overridden: 'Overridden',
  fail: 'Blocked',
  'not-applicable': 'Skipped',
}

export default function PublishGatesBanner({ gates }: Props) {
  const items: Array<{ key: string; label: string; status: GateStatus; hint: string }> = [
    {
      key: 'tnc',
      label: 'T&Cs',
      status: gates.tnc,
      hint:
        gates.tnc === 'pass'
          ? 'Verified terms or waiver provided'
          : gates.tnc === 'fail'
          ? 'Paste official T&Cs or supply a waiver reason'
          : gates.tnc === 'overridden'
          ? 'Bypassed with a logged reason'
          : 'Not required for this alert type',
    },
    {
      key: 'factcheck',
      label: 'Fact-check',
      status: gates.factcheck,
      hint:
        gates.factcheck === 'pass'
          ? 'No high-severity unsupported claims'
          : gates.factcheck === 'fail'
          ? 'Resolve, strip, or override high-severity claims'
          : 'Bypassed with a logged reason',
    },
    {
      key: 'voice',
      label: 'Voice',
      status: gates.voice,
      hint:
        gates.voice === 'pass'
          ? 'Sounds like the persona'
          : gates.voice === 'fail'
          ? 'Regenerate or override with a reason'
          : gates.voice === 'overridden'
          ? 'Bypassed with a logged reason'
          : 'Not yet checked',
    },
  ]

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '0.75rem 0.875rem',
        background: gates.canPublish ? '#F0FDF4' : '#FEF3C7',
        border: `1px solid ${gates.canPublish ? '#86EFAC' : '#FDE68A'}`,
        borderRadius: 'var(--radius-ui)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.625rem',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: gates.canPublish ? '#14532D' : '#78350F',
          }}
        >
          {gates.canPublish ? '✓ Ready to publish' : '⚠ Publish blocked'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {items.map((g) => (
          <span key={g.key} title={g.hint}>
            <Badge tone={TONE[g.status]}>
              {ICON[g.status]} {g.label}: {LABEL[g.status]}
            </Badge>
          </span>
        ))}
      </div>
      {gates.failures.length > 0 && (
        <ul
          style={{
            margin: '0.625rem 0 0',
            paddingLeft: '1.125rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: '#78350F',
            lineHeight: 1.5,
          }}
        >
          {gates.failures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
