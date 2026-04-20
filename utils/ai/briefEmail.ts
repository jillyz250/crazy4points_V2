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

export interface ApproveMetaProgram {
  name: string
  slug: string
}

export interface ApproveMeta {
  alertId?: string
  endDate?: string | null
  programNames?: string[]
  programs?: ApproveMetaProgram[]
  computedScore?: number | null
  factCheck?: {
    openClaimCount: number
    likelyWrongCount: number
  }
}

export interface RecentAlertCtx {
  id: string
  title: string
  type: string
  end_date: string | null
  programs?: { name: string; slug: string }[]
}

export interface BriefContext {
  plan?: EditorialPlan | null
  briefId?: string
  siteOrigin?: string // e.g. https://crazy4points.com
  recentAlertsById?: Record<string, RecentAlertCtx>
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
  // Bulletproof button — table-based so Outlook (which ignores background: on <a>)
  // and conservative Gmail renderings still show a solid colored button.
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="display:inline-block;margin:0 8px 4px 0;vertical-align:middle;border-collapse:separate;">
    <tr><td align="center" bgcolor="${color}" style="border-radius:6px;mso-padding-alt:8px 16px 8px 16px;">
      <!--[if mso]>&nbsp;<![endif]--><a href="${href}" style="display:inline-block;padding:8px 16px;font-family:sans-serif;font-size:12px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;background-color:${color};">${label}</a><!--[if mso]>&nbsp;<![endif]-->
    </td></tr>
  </table>`
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

function programBadge(name: string, origin?: string, slug?: string): string {
  const inner = `<span style="display:inline-block;padding:2px 8px;margin:0 4px 4px 0;background:#F8F5FB;border:1px solid #E6DEEE;border-radius:999px;font-size:11px;font-weight:600;color:#6B2D8F;">${name}</span>`
  if (origin && slug) {
    return `<a href="${origin}/programs/${slug}" style="text-decoration:none;">${inner}</a>`
  }
  return inner
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
  item: { intel_id: string; headline: string; why_publish: string },
  meta: ApproveMeta,
  isNewsletterPick = false
): string {
  const reviewHref = meta.alertId ? `${origin}/admin/alerts/${meta.alertId}/edit` : null
  const chip = deadlineChip(meta.endDate)
  const borderColor = isNewsletterPick ? '#D4AF37' : chip.urgent ? '#d97706' : '#2f855a'

  const programs = meta.programs ?? (meta.programNames ?? []).map((name) => ({ name, slug: '' }))
  const badges = programs.map((p) => programBadge(p.name, origin, p.slug || undefined)).join('')

  const fc = meta.factCheck
  const factCheckBadge = fc && fc.openClaimCount > 0
    ? (() => {
        const wrong = fc.likelyWrongCount > 0
        const bg = wrong ? '#fdecea' : '#fff8e1'
        const color = wrong ? '#7a1f1f' : '#7a5a1f'
        const border = wrong ? '#f5c6cb' : '#fde68a'
        const toVerify = fc.openClaimCount - fc.likelyWrongCount
        const label = wrong
          ? toVerify > 0
            ? `⚠ ${fc.likelyWrongCount} likely wrong · ${toVerify} to verify`
            : `⚠ ${fc.likelyWrongCount} likely wrong`
          : `⚠ ${fc.openClaimCount} to verify`
        const chipStyle = `display:inline-block;padding:2px 8px;margin:0 4px 4px 0;background:${bg};color:${color};border:1px solid ${border};border-radius:999px;font-size:11px;font-weight:600;text-decoration:none;`
        return reviewHref
          ? `<a href="${reviewHref}#fact-check" style="${chipStyle}">${label}</a>`
          : `<span style="${chipStyle}">${label}</span>`
      })()
    : ''

  const chipsRow = chip.html || badges || factCheckBadge
    ? `<div style="margin:0 0 8px;">${chip.html}${chip.html && (badges || factCheckBadge) ? ' ' : ''}${factCheckBadge}${badges}</div>`
    : ''

  const newsletterRibbon = isNewsletterPick
    ? `<div style="margin:-16px -16px 12px;padding:6px 16px;background:#0d1b3e;color:#fff;border-radius:8px 8px 0 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">📧 Newsletter Pick</div>`
    : ''

  const scoreLine = typeof meta.computedScore === 'number' && !isNaN(meta.computedScore)
    ? `<p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#888;letter-spacing:0.04em;text-transform:uppercase;">Score ${meta.computedScore.toFixed(1)}</p>`
    : ''

  return `
    <div style="margin-bottom:14px;padding:16px;background:#fff;border-radius:8px;border-left:4px solid ${borderColor};overflow:hidden;">
      ${newsletterRibbon}
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1A1A1A;">${item.headline}</p>
      ${scoreLine}
      ${chipsRow}
      <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#4A4A4A;">${item.why_publish}</p>
      ${reviewHref ? button(reviewHref, 'Review &amp; Publish', '#6B2D8F') : ''}
    </div>`
}

const REASON_LABELS: Record<string, string> = {
  duplicate: 'Duplicates',
  out_of_scope: 'Out of scope',
  low_quality: 'Low quality',
  rumor: 'Rumors',
  brand_excluded: 'Brand excluded',
  missing_data: 'Missing data',
}

function rejectCard(
  origin: string,
  item: { intel_id: string; headline: string; why_reject: string }
): string {
  const reviewHref = `${origin}/admin/alerts?status=pending_review&intel=${encodeURIComponent(item.intel_id)}`
  return `
    <div style="margin-bottom:6px;padding:8px 12px;background:#fff;border-radius:6px;border-left:3px solid #b45309;">
      <p style="margin:0 0 2px;font-size:12px;font-weight:600;color:#1A1A1A;line-height:1.3;">${item.headline}</p>
      <p style="margin:0 0 4px;font-size:11px;color:#4A4A4A;line-height:1.4;">${item.why_reject}</p>
      <a href="${reviewHref}" style="font-size:11px;color:#b45309;font-weight:600;">Review &amp; Reject →</a>
    </div>`
}

function alertMetaLine(meta: RecentAlertCtx | null): string {
  if (!meta) return ''
  const parts: string[] = []
  if (meta.programs && meta.programs.length) {
    parts.push(meta.programs.map((p) => p.name).join(' · '))
  }
  if (meta.end_date) {
    const d = new Date(meta.end_date)
    if (!isNaN(d.getTime())) {
      const now = Date.now()
      const delta = d.getTime() - now
      if (delta < 0) {
        parts.push(`expired ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
      } else {
        parts.push(`ends ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
      }
    }
  }
  return parts.length
    ? `<p style="margin:2px 0 0;font-size:11px;color:#6B7280;">${parts.join(' · ')}</p>`
    : ''
}

function featuredSlotCard(
  origin: string,
  slot: EditorialPlan['featured_slots'][number],
  currentMeta: RecentAlertCtx | null,
  suggestedMeta: RecentAlertCtx | null
): string {
  void origin // feature_replace action removed; origin retained for future wiring
  if (slot.action === 'keep') {
    return `
      <div style="margin-bottom:10px;padding:12px 16px;background:#fff;border-radius:8px;border-left:4px solid #888;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#4A4A4A;text-transform:uppercase;letter-spacing:0.05em;">Slot ${slot.slot} · Keep</p>
        <p style="margin:4px 0 2px;font-size:13px;font-weight:600;color:#1A1A1A;">${currentMeta?.title ?? '<em>empty</em>'}</p>
        ${alertMetaLine(currentMeta)}
        <p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#4A4A4A;">${slot.reason}</p>
      </div>`
  }
  return `
    <div style="margin-bottom:10px;padding:12px 16px;background:#fff;border-radius:8px;border-left:4px solid #6B2D8F;">
      <p style="margin:0;font-size:12px;font-weight:700;color:#6B2D8F;text-transform:uppercase;letter-spacing:0.05em;">Slot ${slot.slot} · Replace</p>
      <p style="margin:6px 0 2px;font-size:12px;color:#888;"><s>${currentMeta?.title ?? 'empty'}</s></p>
      ${currentMeta ? alertMetaLine(currentMeta) : ''}
      <p style="margin:10px 0 2px;font-size:14px;font-weight:700;color:#1A1A1A;">→ ${suggestedMeta?.title ?? slot.suggested_alert_id}</p>
      ${suggestedMeta ? alertMetaLine(suggestedMeta) : ''}
      <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#4A4A4A;">${slot.reason}</p>
    </div>`
}

function blogIdeaCard(
  item: { title: string; pitch: string; priority?: 'hot' | 'evergreen'; why_now?: string },
  siteOrigin: string
): string {
  const isHot = item.priority === 'hot'
  const badge = isHot
    ? `<span style="display:inline-block;padding:2px 8px;background:#FEE2E2;color:#B91C1C;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.3px;">🔥 HOT</span>`
    : `<span style="display:inline-block;padding:2px 8px;background:#F8F5FB;color:#6B2D8F;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.3px;">📁 EVERGREEN</span>`
  const border = isHot ? '#D4AF37' : '#E6DEEE'
  return `
    <div style="margin-bottom:8px;padding:10px 14px;background:#fff;border-radius:8px;border-left:3px solid ${border};">
      <div style="margin:0 0 4px;">${badge}</div>
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1A1A1A;line-height:1.3;">${item.title}</p>
      <p style="margin:0 0 4px;font-size:12px;line-height:1.45;color:#4A4A4A;">${item.pitch}</p>
      ${item.why_now ? `<p style="margin:0 0 6px;font-size:11px;line-height:1.4;color:#888;"><em>${item.why_now}</em></p>` : ''}
      <a href="${siteOrigin}/admin/content-ideas?type=blog" style="font-size:11px;color:#6B2D8F;font-weight:600;">Draft this post →</a>
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

    // Priority sort: newsletter picks first, then urgent (<=48h), then other
    // deadlined items (earliest first), then the rest in Sonnet's order.
    const approvePriority = (intelId: string, endDate: string | null | undefined): number => {
      const isNewsletter = newsletterIntelIds.has(intelId)
      if (!endDate) return isNewsletter ? 1 : 4
      const t = new Date(endDate).getTime()
      if (isNaN(t)) return isNewsletter ? 1 : 4
      const hoursLeft = (t - Date.now()) / (60 * 60 * 1000)
      if (isNewsletter) return 0
      if (hoursLeft > 0 && hoursLeft <= 48) return 2
      return 3
    }
    const sortedApprove = [...plan.approve].sort((a, b) => {
      const pa = approvePriority(a.intel_id, approveMetaByIntelId[a.intel_id]?.endDate)
      const pb = approvePriority(b.intel_id, approveMetaByIntelId[b.intel_id]?.endDate)
      if (pa !== pb) return pa - pb
      // Within same bucket, sort by end_date ascending (soonest first)
      const ea = approveMetaByIntelId[a.intel_id]?.endDate
      const eb = approveMetaByIntelId[b.intel_id]?.endDate
      if (ea && eb) return new Date(ea).getTime() - new Date(eb).getTime()
      if (ea) return -1
      if (eb) return 1
      return 0
    })

    const approveLegend = sortedApprove.length
      ? `<p style="margin:-8px 0 12px;font-size:11px;color:#888;line-height:1.5;">
          <span style="display:inline-block;width:8px;height:8px;background:#D4AF37;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>gold = newsletter pick
          &nbsp;·&nbsp;
          <span style="display:inline-block;width:8px;height:8px;background:#2f855a;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>green = standard approve
          &nbsp;·&nbsp;
          <span style="display:inline-block;width:8px;height:8px;background:#d97706;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>amber = under 48h
        </p>`
      : ''

    const approveHtml = sortedApprove.length
      ? `${sectionHeader('✅ Approve These', '#2f855a')}${approveLegend}${sortedApprove
          .map((a) => {
            const meta = approveMetaByIntelId[a.intel_id] ?? {}
            return approveCard(
              siteOrigin,
              a,
              {
                alertId: meta.alertId ?? alertIdByIntelId[a.intel_id],
                endDate: meta.endDate,
                programNames: meta.programNames,
                programs: meta.programs,
                computedScore: meta.computedScore,
                factCheck: meta.factCheck,
              },
              newsletterIntelIds.has(a.intel_id)
            )
          })
          .join('')}`
      : ''

    const rejectHtml = plan.reject.length
      ? (() => {
          const COLLAPSE_THRESHOLD = 5
          const total = plan.reject.length
          const adminUrl = `${siteOrigin}/admin/alerts?status=pending_review`

          // Group by reason_category for display
          const byReason = new Map<string, typeof plan.reject>()
          for (const r of plan.reject) {
            const list = byReason.get(r.reason_category) ?? []
            list.push(r)
            byReason.set(r.reason_category, list)
          }

          if (total > COLLAPSE_THRESHOLD) {
            const parts = Array.from(byReason.entries())
              .map(([cat, items]) => `${items.length} ${REASON_LABELS[cat] ?? cat.replace(/_/g, ' ')}`)
              .join(', ')
            return `${sectionHeader('🗑 Reject Queue', '#b45309')}
              <div style="margin:0 0 20px;padding:12px 16px;background:#fff;border-radius:8px;border-left:3px solid #b45309;">
                <p style="margin:0 0 6px;font-size:13px;color:#1A1A1A;font-weight:600;">${total} items to clear</p>
                <p style="margin:0 0 8px;font-size:12px;color:#4A4A4A;line-height:1.5;">${parts}</p>
                <a href="${adminUrl}" style="font-size:12px;color:#b45309;font-weight:600;">Review in admin →</a>
              </div>`
          }

          const orderedReasons = ['duplicate', 'out_of_scope', 'low_quality', 'rumor', 'brand_excluded', 'missing_data']
          const grouped = orderedReasons
            .filter((cat) => byReason.has(cat))
            .map((cat) => {
              const items = byReason.get(cat)!
              const label = REASON_LABELS[cat] ?? cat.replace(/_/g, ' ')
              return `<p style="margin:12px 0 6px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.4px;">${label} · ${items.length}</p>
                ${items.map((r) => rejectCard(siteOrigin, r)).join('')}`
            })
            .join('')

          return `${sectionHeader('🗑 Reject Queue', '#b45309')}${grouped}`
        })()
      : ''

    const slotsHtml = plan.featured_slots.length
      ? `${sectionHeader('⭐ Homepage Slots', '#D4AF37')}${plan.featured_slots
          .map((s) => {
            const currentMeta = s.current_alert_id
              ? recentAlertsById[s.current_alert_id] ?? null
              : null
            const suggestedMeta =
              s.action === 'replace'
                ? recentAlertsById[s.suggested_alert_id] ?? null
                : null
            return featuredSlotCard(siteOrigin, s, currentMeta, suggestedMeta)
          })
          .join('')}
          <div style="text-align:right;margin-top:6px;">
            <a href="${siteOrigin}/admin/homepage" style="font-size:12px;color:#6B2D8F;font-weight:600;">Open homepage manager →</a>
          </div>`
      : ''

    const sortedBlogIdeas = [...plan.blog_ideas].sort((a, b) => {
      const aHot = a.priority === 'hot' ? 0 : 1
      const bHot = b.priority === 'hot' ? 0 : 1
      return aHot - bHot
    })
    const blogHtml = sortedBlogIdeas.length
      ? `${sectionHeader('✍️ Blog Post Ideas', '#6B2D8F')}${sortedBlogIdeas.map((i) => blogIdeaCard(i, siteOrigin)).join('')}`
      : ''

    // Newsletter picks are now tagged inline on the approve cards (gold ribbon
     // + "Newsletter Pick" chip). Approved items auto-queue into admin for
     // weekly review, so no dedicated section is needed here.
    const newsletterHint = plan.newsletter_candidates.length
      ? `<div style="margin:0 0 20px;padding:10px 14px;background:#F8F5FB;border-radius:6px;font-size:12px;color:#4A4A4A;text-align:center;">
          ${plan.newsletter_candidates.length} of today's approves also tagged for the newsletter —
          <a href="${siteOrigin}/admin/content-ideas?type=newsletter" style="color:#6B2D8F;font-weight:600;">open the newsletter queue</a>.
        </div>`
      : ''

    // Split editorial note into short paragraphs on sentence boundaries so it
    // stays scannable even if Sonnet emits one dense blob.
    const noteSentences = (plan.editorial_note ?? '')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const editorialNote = noteSentences.length
      ? `<div style="margin:0 0 28px;padding:18px 20px;background:#F8F5FB;border-left:4px solid #6B2D8F;border-radius:8px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6B2D8F;">Why today matters</p>
          ${noteSentences.map((s) => `<p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#1A1A1A;">${s}</p>`).join('')}
        </div>`
      : ''

    editorialSections = `${editorialNote}${slotsHtml}${approveHtml}${newsletterHint}${blogHtml}${rejectHtml}`
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">

    <div style="background:linear-gradient(135deg,#0d1b3e 0%,#6B2D8F 100%);border-radius:12px;padding:28px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#D4AF37;text-transform:uppercase;">Crazy4Points Daily Brief</p>
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#fff;">${date}</h1>
      ${plan?.tagline ? `<p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#fff;line-height:1.4;">${plan.tagline}</p>` : ''}
      ${plan ? (() => {
        const topMoveHtml = plan.top_move && plan.top_move.trim()
          ? `<p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.95);line-height:1.5;">🎯 <strong style="color:#fff;">${plan.top_move}</strong></p>`
          : ''
        const endDates = Object.values(approveMetaByIntelId)
          .map((m) => (m.endDate ? new Date(m.endDate) : null))
          .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
        const now = Date.now()
        const dayMs = 24 * 60 * 60 * 1000
        const in48h = endDates.filter((d) => {
          const delta = d.getTime() - now
          return delta > 0 && delta <= 2 * dayMs
        }).length
        const in7d = endDates.filter((d) => {
          const delta = d.getTime() - now
          return delta > 2 * dayMs && delta <= 7 * dayMs
        }).length
        const in30d = endDates.filter((d) => {
          const delta = d.getTime() - now
          return delta > 7 * dayMs && delta <= 30 * dayMs
        }).length
        const radarParts: string[] = []
        if (in48h) radarParts.push(`🔥 ${in48h} in 48h`)
        if (in7d) radarParts.push(`⏰ ${in7d} this week`)
        if (in30d) radarParts.push(`📅 ${in30d} this month`)
        const radarHtml = radarParts.length
          ? `<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.85);line-height:1.5;">Deadline radar · ${radarParts.join(' · ')}</p>`
          : ''
        return `${topMoveHtml}${radarHtml}`
      })() : `<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">${findings.length} finding${findings.length !== 1 ? 's' : ''}</p>`}
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
