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
  'not-applicable': 'N/A',
}

// Per-gate label override for not-applicable — "N/A" is ambiguous; surface
// the actual reason it doesn't apply.
function naLabel(gateKey: string): string {
  if (gateKey === 'tnc') return 'N/A (not a promo)'
  if (gateKey === 'voice') return 'Not yet run'
  return 'N/A'
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
          : 'T&Cs only required for promo-shaped alert types (transfer bonus, limited offer, point purchase, etc.). This alert type doesn\'t have terms to verify.',
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
          : 'Voice check hasn\'t been run yet — run it before publishing to make sure the draft sounds on-brand. The gate auto-passes when never run (legacy compat for pre-Phase 1 alerts).',
    },
    {
      key: 'source',
      label: 'Source',
      status: gates.source,
      hint:
        gates.source === 'pass'
          ? 'Official issuer/program source (or verified T&Cs) attached'
          : gates.source === 'fail'
          ? 'State-claim alert needs an official source, not just a blog'
          : gates.source === 'overridden'
          ? 'Bypassed with a logged reason'
          : 'Only required for alerts asserting a program state (partner/redemption/rate change).',
    },
    {
      key: 'legal',
      label: 'Legal',
      status: gates.legal,
      hint:
        gates.legal === 'pass'
          ? 'Legal disclosure attached (not affiliated / not advice)'
          : gates.legal === 'fail'
          ? 'Financial or offer alert needs a legal disclosure — route to Charlie'
          : gates.legal === 'overridden'
          ? 'Bypassed with a logged reason'
          : 'Only required for financial-product alerts (bank/card/deposit bonuses, point purchase) or alerts with an outbound offer link.',
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
              {ICON[g.status]} {g.label}: {g.status === 'not-applicable' ? naLabel(g.key) : LABEL[g.status]}
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
