import type { ScoutFinding } from './runScout'

const URGENCY: Record<string, { label: string; color: string }> = {
  high:   { label: 'HIGH',   color: '#c0392b' },
  medium: { label: 'MEDIUM', color: '#b45309' },
  low:    { label: 'LOW',    color: '#555555' },
}

function findingCard(f: ScoutFinding): string {
  const badge = URGENCY[f.confidence] ?? URGENCY.low
  const source = f.source_url
    ? `<a href="${f.source_url}" style="color:#D4AF37;">${f.source_name}</a>`
    : f.source_name

  return `
    <div style="margin-bottom:12px;padding:14px 16px;background:#fff;border-radius:8px;border-left:4px solid ${badge.color};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:700;color:${badge.color};letter-spacing:0.05em;">${badge.label}</span>
        <span style="font-size:11px;color:#888;">· ${source} · ${f.alert_type?.replace(/_/g, ' ') ?? 'intel'}</span>
      </div>
      <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1A;">${f.headline}</p>
      ${f.raw_text ? `<p style="margin:6px 0 0;font-size:12px;color:#555;font-style:italic;">"${f.raw_text.slice(0, 180)}${f.raw_text.length > 180 ? '…' : ''}"</p>` : ''}
    </div>`
}

export function buildBriefEmail(findings: ScoutFinding[], date: string): string {
  const high   = findings.filter((f) => f.confidence === 'high')
  const medium = findings.filter((f) => f.confidence === 'medium')
  const low    = findings.filter((f) => f.confidence === 'low')

  const section = (title: string, items: ScoutFinding[]) =>
    items.length === 0 ? '' : `
      <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#D4AF37;margin:24px 0 10px;">${title}</h2>
      ${items.map(findingCard).join('')}`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d1b3e 0%,#6B2D8F 100%);border-radius:12px;padding:28px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#D4AF37;text-transform:uppercase;">Daily Intelligence Brief</p>
      <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#fff;">crazy4points</h1>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">${date} · ${findings.length} finding${findings.length !== 1 ? 's' : ''}</p>
    </div>

    <!-- Findings -->
    ${section('🔴 High Confidence', high)}
    ${section('🟡 Medium Confidence', medium)}
    ${section('⚪ Low Confidence / Rumors', low)}

    ${findings.length === 0 ? '<p style="color:#888;text-align:center;padding:32px 0;">Nothing notable today.</p>' : ''}

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0 16px;">
      <a href="https://crazy4points.com/admin/alerts" style="display:inline-block;padding:12px 28px;background:#6B2D8F;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
        Review &amp; Approve in Admin
      </a>
    </div>

    <p style="font-size:11px;color:#aaa;text-align:center;margin:0;">
      crazy4points · Daily Scout Brief · <a href="https://crazy4points.com" style="color:#aaa;">crazy4points.com</a>
    </p>
  </div>
</body>
</html>`
}
