import type { SupabaseClient } from '@supabase/supabase-js'
import { runIntegrityChecks, type IntegrityFinding } from '@/utils/integrity/runIntegrityChecks'

/**
 * Collects every unreviewed monitoring signal into one structured digest,
 * grouped by PRIORITY (not by monitor). Powers the single Daily Data Digest
 * email that replaces the six scattered monitor emails.
 *
 * Sources:
 *   - change_signals (status='new')        -> transfer/award/devaluation + transfer_bonus
 *   - card_bonus_signals (status='new')    -> welcome-bonus changes
 *   - verification_findings (status='new') -> transfer re-verify discrepancies
 *   - runIntegrityChecks() live            -> structural issues (not persisted anywhere)
 *   - cron_runs (latest per job)           -> system-health section
 *
 * Read-only. The route renders this; this file makes no decisions about email.
 */

export interface DigestSignal {
  kind: 'change' | 'transfer_bonus' | 'card_bonus' | 'verification' | 'integrity' | 'stale_alert' | 'drift'
  confidence?: string | null
  label: string
  detail: string
  href?: string
  /** Non-blocking annotation, e.g. "already alerted: <title>" from the cross-check. */
  note?: string
}

export interface MonitorHealth {
  job: string
  label: string
  cadence: 'daily' | 'every-3-days' | 'weekly'
  status: 'ok' | 'stale' | 'failed' | 'never'
  lastRunAt: string | null
  ageHours: number | null
  durationMs: number | null
  recordsChecked: number | null
  recordsChanged: number | null
}

export interface Digest {
  generatedAt: string
  needsReview: DigestSignal[]
  verify: DigestSignal[]
  drift: DigestSignal[]
  staleAlerts: DigestSignal[]
  health: MonitorHealth[]
  counts: {
    newTotal: number
    critical: number
    needsReview: number
    verify: number
    healthIssues: number
    deduped: number
    alreadyCovered: number
    staleAlerts: number
    drift: number
  }
}

const ADMIN = 'https://www.crazy4points.com/admin'

// Monitors we expect to log a cron_runs row, with how fresh that row must be
// before we flag it. Buffer added so a job that runs at 13:00 isn't "stale" at
// 13:01 the next day.
const MONITORS: Array<{ job: string; label: string; cadence: MonitorHealth['cadence']; maxAgeHours: number }> = [
  { job: 'run-scout', label: 'Scout (intel)', cadence: 'daily', maxAgeHours: 26 },
  { job: 'announcement-monitor', label: 'Announcement / change-signals', cadence: 'daily', maxAgeHours: 26 },
  { job: 'card-bonus-monitor', label: 'Welcome-bonus', cadence: 'daily', maxAgeHours: 26 },
  { job: 'transfer-bonus-monitor', label: 'Transfer-bonus', cadence: 'every-3-days', maxAgeHours: 74 },
  { job: 'data-integrity', label: 'Data integrity', cadence: 'daily', maxAgeHours: 26 },
  { job: 'audit-good-to-know', label: 'Good-to-know audit', cadence: 'weekly', maxAgeHours: 8 * 24 + 2 },
  { job: 'reverify', label: 'Re-verify transfers', cadence: 'weekly', maxAgeHours: 8 * 24 + 2 },
  { job: 'daily-digest', label: 'Daily digest (self)', cadence: 'daily', maxAgeHours: 26 },
]

function hoursSince(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / 3_600_000
}

const CONF_RANK: Record<string, number> = { high: 3, med: 2, low: 1 }
const STOP = new Set([
  'the', 'and', 'for', 'with', 'now', 'its', 'our', 'are', 'will', 'has', 'have', 'not',
  'live', 'but', 'data', 'flagged', 'announced', 'announces', 'new', 'change', 'changes',
  'transfer', 'points', 'miles', 'rewards', 'program', 'partner', 'partners',
])

function summaryTokens(s: string | null): Set<string> {
  return new Set(
    String(s ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

/**
 * Collapse look-alike change_signals: same (program_slug, signal_type) AND
 * summaries that overlap heavily are the same news reworded (the Etihad ×2 /
 * Wyndham ×2 case). Keeps the highest-confidence, longest (most descriptive)
 * representative. Distinct topics under the same program+type (e.g. two
 * different hilton devaluations) stay separate because their wording differs.
 */
function dedupeChangeSignals<T extends Record<string, string | null>>(
  rows: T[],
): { rows: T[]; collapsed: number } {
  const kept: Array<{ row: T; tokens: Set<string> }> = []
  let collapsed = 0
  for (const r of rows) {
    const rt = summaryTokens(r.summary)
    const hit = kept.find(
      (k) =>
        k.row.program_slug === r.program_slug &&
        k.row.signal_type === r.signal_type &&
        jaccard(k.tokens, rt) >= 0.4,
    )
    if (hit) {
      collapsed++
      const better =
        (CONF_RANK[r.confidence ?? 'low'] ?? 1) > (CONF_RANK[hit.row.confidence ?? 'low'] ?? 1) ||
        String(r.summary ?? '').length > String(hit.row.summary ?? '').length
      if (better) {
        hit.row = r
        hit.tokens = rt
      }
    } else {
      kept.push({ row: r, tokens: rt })
    }
  }
  return { rows: kept.map((k) => k.row), collapsed }
}

/**
 * Auto-dismiss transfer-bonus findings whose end-date has passed. The monitor
 * writes summaries like "...Flying Blue (ends 2026-06-30)..."; once that date is
 * gone the bonus is moot and shouldn't keep showing in 🔴. Returns how many were
 * cleared. Safe: only touches signal_type='transfer_bonus', status='new'.
 */
export async function autoExpireBonusSignals(
  supabase: SupabaseClient,
  todayISO: string,
): Promise<number> {
  const { data } = await supabase
    .from('change_signals')
    .select('id, summary')
    .eq('status', 'new')
    .eq('signal_type', 'transfer_bonus')
  const today = todayISO.slice(0, 10)
  const expired: string[] = []
  for (const r of (data ?? []) as Array<{ id: string; summary: string | null }>) {
    const m = String(r.summary ?? '').match(/ends?\s+(\d{4}-\d{2}-\d{2})/i)
    if (m && m[1] < today) expired.push(r.id)
  }
  if (expired.length) {
    await supabase.from('change_signals').update({ status: 'dismissed' }).in('id', expired)
  }
  return expired.length
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

/**
 * Best-effort "this references a date that has passed" detector for evergreen
 * (no-end_date) published alerts. Catches explicit dates ("Ends April 30",
 * "through 2026-05-15") and bare past months of the current year ("in May",
 * "before February"). Soft signal — feeds a review list, not an auto-action,
 * so a few false positives are acceptable; conservative enough to avoid most.
 */
function referencesPastDate(text: string, now: Date): boolean {
  const s = text.toLowerCase()
  const curY = now.getUTCFullYear()
  const curM = now.getUTCMonth() // 0-based
  // Explicit ISO date
  for (const m of s.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`)
    if (d.getTime() < now.getTime()) return true
  }
  // Month (+ optional year) tied to a timing word
  const re = new RegExp(`\\b(?:ends?|through|by|before|in|until|expires?)\\s+(${MONTHS.join('|')})(?:\\s+(\\d{4}))?`, 'g')
  for (const m of s.matchAll(re)) {
    const mi = MONTHS.indexOf(m[1])
    const yr = m[2] ? Number(m[2]) : curY
    if (yr < curY || (yr === curY && mi < curM)) return true
  }
  return false
}

export async function buildDigest(supabase: SupabaseClient): Promise<Digest> {
  const nowMs = Date.now()
  const generatedAt = new Date(nowMs).toISOString()

  // --- persisted signals (status='new') + published alerts for cross-check ---
  const [changeRes, cardRes, verifyRes, alertRes, progRes, driftRes] = await Promise.all([
    supabase
      .from('change_signals')
      .select('program_slug, signal_type, summary, confidence, source_name, source_url')
      .eq('status', 'new')
      .order('confidence', { ascending: true })
      .order('last_seen_at', { ascending: false }),
    supabase
      .from('card_bonus_signals')
      .select('card_name, card_slug, summary, confidence, detected_amount, stored_amount')
      .eq('status', 'new')
      .order('last_seen_at', { ascending: false }),
    supabase
      .from('verification_findings')
      .select('program_slug, partner_name, finding_type, ours, theirs, summary, confidence')
      .eq('status', 'new')
      .order('last_seen_at', { ascending: false }),
    supabase
      .from('alerts')
      .select('title, summary, primary_program_id, end_date, published_at')
      .eq('status', 'published'),
    supabase.from('programs').select('id, slug'),
    // Program-fact drift: Scout's ingest already compares fresh intel against our
    // stored program facts and records UNRESOLVED conflicts. Surface them.
    supabase
      .from('intel_items')
      .select('headline, conflict_field, conflict_summary, conflicts_program_id, conflict_detected_at')
      .not('conflicts_program_id', 'is', null)
      .is('conflict_resolution', null)
      .is('archived_at', null)
      .order('conflict_detected_at', { ascending: false })
      .limit(20),
  ])

  // id -> slug so we can match alerts (primary_program_id) to signals (program_slug)
  const idToSlug = new Map<string, string>()
  for (const p of (progRes.data ?? []) as Array<{ id: string; slug: string }>) idToSlug.set(p.id, p.slug)

  // Per-program token sets of published-alert text, for the "already alerted" cross-check.
  type PubAlert = { title: string; summary: string | null; primary_program_id: string | null; end_date: string | null; published_at: string | null }
  const pubAlerts = (alertRes.data ?? []) as PubAlert[]
  const alertsByProgram = new Map<string, Array<{ title: string; tokens: Set<string> }>>()
  for (const a of pubAlerts) {
    const slug = a.primary_program_id ? idToSlug.get(a.primary_program_id) : undefined
    if (!slug) continue
    const arr = alertsByProgram.get(slug) ?? []
    arr.push({ title: a.title, tokens: summaryTokens(`${a.title} ${a.summary ?? ''}`) })
    alertsByProgram.set(slug, arr)
  }

  function coveringAlert(programSlug: string | null, summary: string | null): string | null {
    if (!programSlug) return null
    const candidates = alertsByProgram.get(programSlug)
    if (!candidates) return null
    const st = summaryTokens(summary)
    let best: { title: string; score: number } | null = null
    for (const c of candidates) {
      const score = jaccard(st, c.tokens)
      if (score >= 0.22 && (!best || score > best.score)) best = { title: c.title, score }
    }
    return best?.title ?? null
  }

  const needsReview: DigestSignal[] = []
  const verify: DigestSignal[] = []
  const staleAlerts: DigestSignal[] = []
  const drift: DigestSignal[] = []
  let alreadyCovered = 0

  // Program-fact drift — unresolved conflicts Scout detected between fresh intel
  // and our stored program pages (award_chart, tier_benefits, transfer_partners…).
  for (const r of (driftRes.data ?? []) as Array<Record<string, string | null>>) {
    const slug = r.conflicts_program_id ? idToSlug.get(r.conflicts_program_id) : undefined
    drift.push({
      kind: 'drift',
      label: `${slug ?? 'program'}${r.conflict_field ? ` · ${r.conflict_field}` : ''}`,
      detail: r.conflict_summary ?? r.headline ?? '',
      href: `${ADMIN}/program-drift`,
    })
  }

  const { rows: changeRows, collapsed: changeCollapsed } = dedupeChangeSignals(
    (changeRes.data ?? []) as Array<Record<string, string | null>>,
  )

  for (const r of changeRows) {
    const isBonus = r.signal_type === 'transfer_bonus'
    const covered = coveringAlert(r.program_slug, r.summary)
    if (covered) alreadyCovered++
    needsReview.push({
      kind: isBonus ? 'transfer_bonus' : 'change',
      confidence: r.confidence,
      label: `${isBonus ? 'Transfer bonus' : r.signal_type ?? 'change'}${r.program_slug ? ` — ${r.program_slug}` : ''}`,
      detail: r.summary ?? '',
      href: r.source_url ?? `${ADMIN}/change-signals`,
      note: covered ? `already alerted: "${covered.slice(0, 60)}"` : undefined,
    })
  }

  for (const r of (cardRes.data ?? []) as Array<Record<string, string | null>>) {
    needsReview.push({
      kind: 'card_bonus',
      confidence: r.confidence,
      label: `Welcome bonus — ${r.card_name ?? r.card_slug ?? 'card'}`,
      detail: r.summary ?? `stored ${r.stored_amount ?? '?'} → detected ${r.detected_amount ?? '?'}`,
      href: `${ADMIN}/card-bonuses`,
    })
  }

  for (const r of (verifyRes.data ?? []) as Array<Record<string, string | null>>) {
    verify.push({
      kind: 'verification',
      confidence: r.confidence,
      label: `Re-verify — ${r.program_slug ?? ''}${r.partner_name ? ` → ${r.partner_name}` : ''} (${r.finding_type ?? ''})`,
      detail: r.summary ?? `ours: ${r.ours ?? '?'} · theirs: ${r.theirs ?? '?'}`,
      href: `${ADMIN}/change-signals`,
    })
  }

  // --- data integrity (run live; nothing persists it) ---
  let integrity: IntegrityFinding[] = []
  try {
    integrity = await runIntegrityChecks(supabase)
  } catch {
    // surfaced via the data-integrity health row instead; don't fail the digest
  }
  for (const f of integrity) {
    const sig: DigestSignal = {
      kind: 'integrity',
      confidence: f.severity,
      label: `Data integrity [${f.severity}] — ${f.check}${f.programSlug ? ` · ${f.programSlug}` : ''}`,
      detail: f.detail,
      href: `${ADMIN}/data-integrity`,
    }
    if (f.severity === 'high') needsReview.push(sig)
    else if (f.severity === 'med') verify.push(sig)
    // low = dashboard-only, omitted from the digest
  }

  // --- stale published alerts (evergreen, no end_date, that read as past-dated
  // or are simply old). Date-bounded deals auto-expire already; these are the
  // ones nothing re-checks. Soft review list. ---
  const now = new Date(nowMs)
  const STALE_AGE_DAYS = 150
  for (const a of pubAlerts) {
    if (a.end_date) continue // date-bounded deals are handled by auto-expire
    const text = `${a.title} ${a.summary ?? ''}`
    const ageDays = a.published_at ? (nowMs - new Date(a.published_at).getTime()) / 86_400_000 : 0
    const pastDated = referencesPastDate(text, now)
    if (!pastDated && ageDays < STALE_AGE_DAYS) continue
    staleAlerts.push({
      kind: 'stale_alert',
      label: a.title.slice(0, 80),
      detail: pastDated ? 'references a date that has passed' : `published ${Math.round(ageDays)}d ago, never re-checked`,
      href: `${ADMIN}/alerts`,
    })
  }

  // --- system health (latest cron_runs row per job) ---
  const { data: runRows } = await supabase
    .from('cron_runs')
    .select('job_name, started_at, completed_at, status, error_message, details')
    .order('started_at', { ascending: false })
    .limit(200)

  const latestByJob = new Map<string, Record<string, unknown>>()
  for (const row of (runRows ?? []) as Array<Record<string, unknown>>) {
    const job = row.job_name as string
    if (!latestByJob.has(job)) latestByJob.set(job, row)
  }

  const health: MonitorHealth[] = MONITORS.map((m) => {
    const row = latestByJob.get(m.job)
    if (!row) {
      return {
        job: m.job, label: m.label, cadence: m.cadence,
        status: 'never', lastRunAt: null, ageHours: null,
        durationMs: null, recordsChecked: null, recordsChanged: null,
      }
    }
    const started = row.started_at as string
    const completed = row.completed_at as string | null
    const ageHours = hoursSince(started, nowMs)
    const rowStatus = row.status as string
    const details = (row.details ?? {}) as Record<string, unknown>
    let status: MonitorHealth['status'] = 'ok'
    if (rowStatus === 'failed') status = 'failed'
    else if (ageHours > m.maxAgeHours) status = 'stale'
    return {
      job: m.job, label: m.label, cadence: m.cadence, status,
      lastRunAt: started,
      ageHours: Math.round(ageHours * 10) / 10,
      durationMs: completed ? new Date(completed).getTime() - new Date(started).getTime() : null,
      recordsChecked: typeof details.records_checked === 'number' ? details.records_checked : null,
      recordsChanged: typeof details.records_changed === 'number' ? details.records_changed : null,
    }
  })

  const critical =
    needsReview.filter((s) => s.confidence === 'high' || s.kind === 'integrity').length
  const healthIssues = health.filter((h) => h.status === 'failed' || h.status === 'stale' || h.status === 'never').length

  return {
    generatedAt,
    needsReview,
    verify,
    drift,
    staleAlerts,
    health,
    counts: {
      newTotal: needsReview.length + verify.length + drift.length,
      critical,
      needsReview: needsReview.length,
      verify: verify.length,
      healthIssues,
      deduped: changeCollapsed,
      alreadyCovered,
      staleAlerts: staleAlerts.length,
      drift: drift.length,
    },
  }
}
