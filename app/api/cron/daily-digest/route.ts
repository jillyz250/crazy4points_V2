/**
 * Daily Data Digest — the single notification layer for all data monitors.
 *
 * Replaces the six scattered monitor emails (announcement, welcome-bonus,
 * transfer-bonus, data-integrity, good-to-know, re-verify) with ONE email,
 * grouped by PRIORITY (not by monitor) and always sent once daily so silence
 * means something broke. See plans/monitoring-consolidation.md.
 *
 * Runs after the last detector (~13:30 UTC). Reads each signal table for
 * unreviewed rows, runs the cheap data-integrity checks live, and reads
 * cron_runs for the system-health section. Writes its own cron_runs row.
 *
 * Modes:
 *   GET/POST                — send the digest email (cron). Auth: assertCron.
 *   GET ...?preview=1       — return the rendered HTML instead of emailing
 *                             (still auth'd) so the layout can be eyeballed.
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET} + x-vercel-cron header.
 */
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { buildDigest, autoExpireBonusSignals, revalidateDriftConflicts, type Digest, type DigestSignal, type MonitorHealth } from '@/utils/integrity/buildDigest'
import { startCronRun, finishCronRun } from '@/lib/cron/recordRun'
import { assertCron } from '@/lib/auth/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: Request) {
  return handle(request)
}
export async function POST(request: Request) {
  return handle(request)
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

function signalRows(signals: DigestSignal[]): string {
  if (!signals.length) return '<p style="margin:4px 0 12px;color:#6b7280">✅ clear</p>'
  return (
    '<ul style="margin:4px 0 12px;padding-left:18px">' +
    signals
      .map(
        (s) =>
          `<li style="margin:6px 0">${s.confidence ? `<b>[${esc(s.confidence)}]</b> ` : ''}<b>${esc(s.label)}</b>: ${esc(s.detail)}${s.href ? ` <a href="${esc(s.href)}">↗</a>` : ''}${s.note ? `<br><span style="color:#9a6b00;font-size:12px">↩ ${esc(s.note)}</span>` : ''}</li>`,
      )
      .join('') +
    '</ul>'
  )
}

const HEALTH_ICON: Record<MonitorHealth['status'], string> = {
  ok: '✅', stale: '🔴', failed: '🔴', never: '⚪',
}

function healthTable(health: MonitorHealth[]): string {
  const rows = health
    .map((h) => {
      const ran = h.lastRunAt ? `${h.ageHours}h ago` : 'no run recorded'
      const runtime = h.durationMs != null ? `${(h.durationMs / 1000).toFixed(1)}s` : '—'
      const signals = h.recordsChanged != null ? String(h.recordsChanged) : '—'
      return `<tr><td style="padding:2px 10px 2px 0">${HEALTH_ICON[h.status]} ${esc(h.label)}</td><td style="padding:2px 10px;color:#6b7280">${esc(ran)}</td><td style="padding:2px 10px;color:#6b7280">${runtime}</td><td style="padding:2px 10px;color:#6b7280">${signals}</td></tr>`
    })
    .join('')
  return `<table style="border-collapse:collapse;font-size:13px"><tr style="text-align:left;color:#9ca3af"><th style="padding:2px 10px 2px 0">Monitor</th><th style="padding:2px 10px">Last run</th><th style="padding:2px 10px">Runtime</th><th style="padding:2px 10px">Changed</th></tr>${rows}</table>`
}

function renderDigest(d: Digest): { subject: string; html: string } {
  const date = new Date(d.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })
  const health = d.counts.healthIssues ? `${d.counts.healthIssues} issue(s)` : 'Healthy'
  const subject =
    d.counts.newTotal === 0 && !d.counts.healthIssues
      ? `Daily Data Digest — ${date} · all clear`
      : `Daily Data Digest — ${date} · ${d.counts.newTotal} new${d.counts.critical ? `, ${d.counts.critical} critical` : ''}`

  const header = `<div style="background:#f8f5fb;border:1px solid #e6deee;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px">
    <b>Daily Data Digest — ${date}</b><br>
    New: ${d.counts.newTotal} · Critical: ${d.counts.critical} · Needs review: ${d.counts.needsReview} · Verify: ${d.counts.verify}${d.counts.drift ? ` · Drift: ${d.counts.drift}` : ''} · System: ${esc(health)}${d.counts.deduped ? ` · ${d.counts.deduped} look-alike${d.counts.deduped === 1 ? '' : 's'} collapsed` : ''}${d.counts.alreadyCovered ? ` · ${d.counts.alreadyCovered} already alerted` : ''}
  </div>`

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:640px">
    ${header}
    <h3 style="margin:18px 0 4px">🔴 Needs review today (${d.needsReview.length})</h3>
    ${signalRows(d.needsReview)}
    <h3 style="margin:18px 0 4px">🟡 Verify (${d.verify.length})</h3>
    ${signalRows(d.verify)}
    ${d.drift.length ? `<h3 style="margin:18px 0 4px">🔬 Program-fact drift (${d.drift.length})</h3>${signalRows(d.drift)}` : ''}
    ${d.staleAlerts.length ? `<h3 style="margin:18px 0 4px">🕸️ Stale published alerts (${d.staleAlerts.length})</h3>${signalRows(d.staleAlerts)}` : ''}
    <h3 style="margin:18px 0 4px">🟢 System health</h3>
    ${healthTable(d.health)}
    <p style="margin-top:18px;color:#9ca3af;font-size:12px">Generated ${esc(d.generatedAt)} · replaces the per-monitor emails · review at <a href="https://www.crazy4points.com/admin/change-signals">/admin</a></p>
  </div>`

  return { subject, html }
}

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied

  const supabase = createAdminClient()
  const preview = new URL(request.url).searchParams.get('preview') === '1'

  const runId = preview ? null : await startCronRun(supabase, 'daily-digest')

  let digest: Digest
  try {
    // Self-clean before building (skipped in preview):
    //  - drop transfer-bonus findings whose end-date has passed
    //  - auto-clear program-fact drift already reflected in current page data
    if (!preview) {
      await autoExpireBonusSignals(supabase, new Date().toISOString())
      await revalidateDriftConflicts(supabase)
    }
    digest = await buildDigest(supabase)
  } catch (err) {
    await finishCronRun(supabase, runId, { status: 'failed', error: String(err) })
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }

  const { subject, html } = renderDigest(digest)

  if (preview) {
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
        to: 'jillzeller6@gmail.com',
        subject,
        html,
      })
    } catch {
      /* email failure shouldn't fail the cron; JSON still reports + run is logged */
    }
  }

  await finishCronRun(supabase, runId, {
    status: 'success',
    recordsChecked: digest.counts.newTotal,
    extra: { critical: digest.counts.critical, health_issues: digest.counts.healthIssues },
  })

  return NextResponse.json({ ok: true, counts: digest.counts })
}
