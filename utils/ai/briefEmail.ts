import type { EditorialPlan } from './generateEditorialPlan'
import { signBulkActionToken } from './bulkActionToken'

// Minimal interface satisfied by both ScoutFinding (in-memory) and IntelItem (DB row)
export interface BriefFinding {
  intel_id?: string
  headline: string
  raw_text?: string | null
  source_name: string
  source_url?: string | null
  confidence: 'high' | 'medium' | 'low'
  alert_type?: string | null
  programs?: string[] | null
}

export interface ApproveMeta {
  alertId?: string
  endDate?: string | null
  programNames?: string[]
}

export interface BriefContext {
  plan?: EditorialPlan | null
  briefId?: string
  siteOrigin?: string // e.g. https://crazy4points.com
  recentAlertsById?: Record<string, { id: string; title: string; type: string; end_date: string | null }>
  alertIdByIntelId?: Record<string, string>
  approveMetaByIntelId?: Record<string, ApproveMeta>
}

const URGENCY: Record<string, { label: string; color: string }> = {
  high:   { label: 'HIGH',   color: '#c0392b' },
  medium: { label: 'MEDIUM', color: '#b45309' },
  low:    { label: 'LOW',    color: '#555555' },
}

function actionUrl(origin: string, token: string): string {
  return `${origin}/api/bulk-action?token=${encodeURIComponent(token)}`
}

function button(href: string, label: string, color = '#6B2D8F'): string {
  return `<a href="${href}" style="display:inline-block;padding:8px 16px;background:${color};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:12px;margin-right:8px;">${label}</a>`
}

function sectionHeader(title: string, color = '#D4AF37'): string {
  return `<div style="margin:32px 0 14px;background:${color};border-radius:6px;padding:10px 16px;">
    <h2 style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#fff;">${title}</h2>
  </div>`
}

function findingCard(f: BriefFinding, whyItMatters?: string): string {
  const badge = URGENCY[f.confidence] ?? URGENCY.low
  const source = f.source_url
    ? `<a href="${f.source_url}" style="color:#D4AF37;">${f.source_name}</a>`
    : f.source_name

  return `
    <div style="margin-bottom:12px;padding:14px 16px;background:#fff;border-radius:8px;border-left:4px solid ${badge.color};">
      ${whyItMatters ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#1A1A1A;font-weight:500;">${whyItMatters}</p>` : ''}
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:700;color:${badge.color};letter-spacing:0.05em;">${badge.label}</span>
        <span style="font-size:11px;color:#888;">· ${source} · ${f.alert_type?.replace(/_/g, ' ') ?? 'intel'}</span>
      </div>
      <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1A;">${f.headline}</p>
      ${f.raw_text ? `<p style="margin:6px 0 0;font-size:12px;color:#555;font-style:italic;">"${f.raw_text.slice(0, 180)}${f.raw_text.length > 180 ? '…' : ''}"</p>` : ''}
    </div>`
}

function programBadge(name: string): string {
  return `<span style="display:inline-block;padding:2px 8px;margin:0 4px 4px 0;background:#F8F5FB;border:1px solid #E6DEEE;border-radius:999px;font-size:11px;font-weight:600;color:#6B2D8F;">${name}</span>`
}

function deadlineChip(endDate: string | null | undefined): { html: string; urgent: boolean } {
  if (!endDate) return { html: '', urgent: false }
  const end = new Date(endDate)
  if (isNaN(end.getTime())) return { html: '', urgent: false }
  const now = Date.now()
  const hoursLeft = (end.getTime() - now) / (60 * 60 * 1000)
  if (hoursLeft < 0) {
    return { html: `<span style="display:inline-block;padding:2px 8px;background:#fee2e2;color:#991b1b;border-radius:999px;font-size:11px;font-weight:700;">EXPIRED</span>`, urgent: false }
  }
  const urgent = hoursLeft <= 48
  const label = urgent ? `⏰ ENDS ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}` : `Ends ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  const bg = urgent ? '#fef3c7' : '#f3f4f6'
  const fg = urgent ? '#92400e' : '#4a4a4a'
  return {
    html: `<span style="display:inline-block;padding:2px 8px;background:${bg};color:${fg};border-radius:999px;font-size:11px;font-weight:700;">${label}</span>`,
    urgent,
  }
}

function approveCard(
  origin: string,
  briefId: string,
  item: { intel_id: string; headline: string; why_publish: string },
  meta: ApproveMeta,
  isNewsletterPick = false
): string {
  const reviewHref = meta.alertId ? `${origin}/admin/alerts/${meta.alertId}/edit` : null
  const approveToken = signBulkActionToken({ brief_id: briefId, action: 'approve', target_id: item.intel_id })
  const chip = deadlineChip(meta.endDate)
  const borderColor = chip.urgent ? '#d97706' : '#2f855a'
  const badges = (meta.programNames ?? []).map(programBadge).join('')
  const newsletterBadge = isNewsletterPick
    ? `<span style="display:inline-block;padding:2px 8px;margin:0 4px 4px 0;background:#0d1b3e;color:#fff;border-radius:999px;font-size:11px;font-weight:600;">📧 Newsletter pick</span>`
    : ''
  const chipsRow = chip.html || badges || newsletterBadge
    ? `<div style="margin:0 0 8px;">${chip.html}${chip.html && (badges || newsletterBadge) ? ' ' : ''}${newsletterBadge}${badges}</div>`
    : ''
  return `
    <div style="margin-bottom:14px;padding:16px;background:#fff;border-radius:8px;border-left:4px solid ${borderColor};">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1A1A1A;">${item.headline}</p>
      ${chipsRow}
      <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#4A4A4A;">${item.why_publish}</p>
      ${reviewHref ? button(reviewHref, 'Review &amp; Publish', '#6B2D8F') : ''}
      ${button(actionUrl(origin, approveToken), 'Quick Publish', '#2f855a')}
    </div>`
}

function rejectCard(
  origin: string,
  briefId: string,
  item: { intel_id: string; headline: string; why_reject: string; reason_category: string }
): string {
  const token = signBulkActionToken({ brief_id: briefId, action: 'reject', target_id: item.intel_id })
  return `
    <div style="margin-bottom:10px;padding:12px 16px;background:#fff;border-radius:8px;border-left:4px solid #b45309;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1A1A1A;">${item.headline}</p>
      <p style="margin:0 0 8px;font-size:12px;color:#4A4A4A;">
        <span style="display:inline-block;padding:1px 6px;background:#f3e6d3;border-radius:3px;font-size:10px;font-weight:700;text-transform:uppercase;color:#92400e;margin-right:6px;">${item.reason_category.replace(/_/g, ' ')}</span>
        ${item.why_reject}
      </p>
      ${button(actionUrl(origin, token), 'Reject', '#b45309')}
    </div>`
}

function featuredSlotCard(
  origin: string,
  briefId: string,
  slot: EditorialPlan['featured_slots'][number],
  currentTitle: string | null,
  suggestedTitle: string | null
): string {
  if (slot.action === 'keep') {
    return `
      <div style="margin-bottom:10px;padding:12px 16px;background:#fff;border-radius:8px;border-left:4px solid #888;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#4A4A4A;text-transform:uppercase;letter-spacing:0.05em;">Slot ${slot.slot} · Keep</p>
        <p style="margin:4px 0 4px;font-size:13px;color:#1A1A1A;">${currentTitle ?? '<em>empty</em>'}</p>
        <p style="margin:0;font-size:12px;color:#4A4A4A;">${slot.reason}</p>
      </div>`
  }
  const token = signBulkActionToken({
    brief_id: briefId,
    action: 'feature_replace',
    target_id: slot.suggested_alert_id,
    slot: slot.slot,
  })
  return `
    <div style="margin-bottom:10px;padding:12px 16px;background:#fff;border-radius:8px;border-left:4px solid #6B2D8F;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#6B2D8F;text-transform:uppercase;letter-spacing:0.05em;">Slot ${slot.slot} · Replace</p>
      <p style="margin:4px 0 2px;font-size:12px;color:#888;"><s>${currentTitle ?? 'empty'}</s></p>
      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1A1A1A;">→ ${suggestedTitle ?? slot.suggested_alert_id}</p>
      <p style="margin:0 0 10px;font-size:12px;color:#4A4A4A;">${slot.reason}</p>
      ${button(actionUrl(origin, token), 'Apply Replacement', '#6B2D8F')}
    </div>`
}

function blogIdeaCard(item: { title: string; pitch: string }): string {
  return `
    <div style="margin-bottom:10px;padding:12px 16px;background:#fff;border-radius:8px;border-left:4px solid #D4AF37;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1A1A1A;">${item.title}</p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#4A4A4A;">${item.pitch}</p>
    </div>`
}

export function buildBriefEmail(
  findings: BriefFinding[],
  date: string,
  ctx: BriefContext = {}
): string {
  const {
    plan,
    briefId,
    siteOrigin = 'https://crazy4points.com',
    recentAlertsById = {},
    alertIdByIntelId = {},
    approveMetaByIntelId = {},
  } = ctx

  const noteMap = new Map((plan?.today_intel_notes ?? []).map((n) => [n.intel_id, n.why_it_matters]))

  const high   = findings.filter((f) => f.confidence === 'high')
  const medium = findings.filter((f) => f.confidence === 'medium')
  const low    = findings.filter((f) => f.confidence === 'low')

  const renderFindings = (items: BriefFinding[]) =>
    items.map((f) => findingCard(f, f.intel_id ? noteMap.get(f.intel_id) : undefined)).join('')

  const renderSection = (title: string, items: BriefFinding[]) =>
    items.length === 0 ? '' : `${sectionHeader(title)}${renderFindings(items)}`

  // Editorial sections (only when we have a plan + briefId)
  let editorialSections = ''
  if (plan && briefId) {
    const newsletterIntelIds = new Set((plan.newsletter_candidates ?? []).map((c) => c.intel_id))
    const approveHtml = plan.approve.length
      ? `${sectionHeader('✅ Approve These', '#2f855a')}${plan.approve
          .map((a) => {
            const meta = approveMetaByIntelId[a.intel_id] ?? {}
            return approveCard(
              siteOrigin,
              briefId,
              a,
              {
                alertId: meta.alertId ?? alertIdByIntelId[a.intel_id],
                endDate: meta.endDate,
                programNames: meta.programNames,
              },
              newsletterIntelIds.has(a.intel_id)
            )
          })
          .join('')}`
      : ''

    const rejectHtml = plan.reject.length
      ? (() => {
          const rejectAllToken = signBulkActionToken({
            brief_id: briefId,
            action: 'reject_all',
            target_id: 'ALL',
          })
          return `${sectionHeader('🗑 Reject Queue', '#b45309')}${plan.reject.map((r) => rejectCard(siteOrigin, briefId, r)).join('')}
            <div style="text-align:right;margin-top:8px;">
              ${button(actionUrl(siteOrigin, rejectAllToken), 'Reject All Pending', '#c0392b')}
            </div>`
        })()
      : ''

    const slotsHtml = plan.featured_slots.length
      ? `${sectionHeader('⭐ Featured Deals Recommendations', '#D4AF37')}${plan.featured_slots
          .map((s) => {
            const currentTitle = s.current_alert_id
              ? recentAlertsById[s.current_alert_id]?.title ?? null
              : null
            const suggestedTitle =
              s.action === 'replace'
                ? recentAlertsById[s.suggested_alert_id]?.title ?? null
                : null
            return featuredSlotCard(siteOrigin, briefId, s, currentTitle, suggestedTitle)
          })
          .join('')}`
      : ''

    const blogHtml = plan.blog_ideas.length
      ? `${sectionHeader('✍️ Blog Post Ideas', '#6B2D8F')}${plan.blog_ideas.map(blogIdeaCard).join('')}`
      : ''

    const newsletterHtml = plan.newsletter_candidates.length
      ? `${sectionHeader('📧 Newsletter Picks', '#0d1b3e')}${plan.newsletter_candidates
          .map((c) => {
            const queueToken = signBulkActionToken({
              brief_id: briefId,
              action: 'queue_newsletter',
              target_id: c.intel_id,
            })
            const dismissToken = signBulkActionToken({
              brief_id: briefId,
              action: 'dismiss_newsletter',
              target_id: c.intel_id,
            })
            return `
              <div style="margin-bottom:12px;padding:14px 16px;background:#fff;border-radius:8px;border-left:4px solid #0d1b3e;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1A1A1A;">${c.headline}</p>
                <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#4A4A4A;">${c.angle}</p>
                ${button(actionUrl(siteOrigin, queueToken), 'Queue for Newsletter', '#0d1b3e')}
                ${button(actionUrl(siteOrigin, dismissToken), 'Dismiss', '#6B7280')}
              </div>`
          })
          .join('')}
          <div style="text-align:right;margin-top:6px;">
            <a href="${siteOrigin}/admin/content-ideas?type=newsletter" style="font-size:12px;color:#6B2D8F;font-weight:600;">Open newsletter queue →</a>
          </div>`
      : ''

    const editorialNote = plan.editorial_note
      ? `<div style="margin:0 0 28px;padding:18px 20px;background:#F8F5FB;border-left:4px solid #6B2D8F;border-radius:8px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#1A1A1A;font-style:italic;">${plan.editorial_note}</p>
        </div>`
      : ''

    editorialSections = `${editorialNote}${approveHtml}${newsletterHtml}${slotsHtml}${blogHtml}${rejectHtml}`
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">

    <div style="background:linear-gradient(135deg,#0d1b3e 0%,#6B2D8F 100%);border-radius:12px;padding:28px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#D4AF37;text-transform:uppercase;">Daily Intelligence Brief</p>
      <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#fff;">crazy4points</h1>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">${date} · ${findings.length} finding${findings.length !== 1 ? 's' : ''}</p>
    </div>

    ${editorialSections}

    ${!plan ? `
      ${sectionHeader("📰 Today's Intel")}
      ${renderSection('🔴 High Confidence', high)}
      ${renderSection('🟡 Medium Confidence', medium)}
      ${renderSection('⚪ Low Confidence / Rumors', low)}
    ` : ''}

    ${findings.length === 0 && !plan ? '<p style="color:#888;text-align:center;padding:32px 0;">Nothing notable today.</p>' : ''}

    <div style="text-align:center;margin:28px 0 16px;">
      <a href="${siteOrigin}/admin/alerts" style="display:inline-block;padding:12px 28px;background:#6B2D8F;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
        Open Admin Dashboard
      </a>
    </div>

    <p style="font-size:11px;color:#aaa;text-align:center;margin:0;">
      crazy4points · Daily Scout Brief · <a href="${siteOrigin}" style="color:#aaa;">crazy4points.com</a>
    </p>
  </div>
</body>
</html>`
}
