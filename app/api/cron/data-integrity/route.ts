/**
 * Daily data-integrity audit for the program/transfer graph.
 *
 * Layer 0 of the data-accuracy plan: cheap deterministic structural checks
 * (orphan/junk slugs, bad ratio formats, deprecated dupe rows, missing currency
 * flags). No LLM, no web - just the shape of our own data. Emails Jill a summary
 * every run (clean or flagged) so a missing email signals the cron itself broke.
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET} + x-vercel-cron header.
 */
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { runIntegrityChecks, type IntegrityFinding } from '@/utils/integrity/runIntegrityChecks'
import { assertCron } from '@/lib/auth/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: Request) {
  return handle(request)
}
export async function POST(request: Request) {
  return handle(request)
}

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied

  const supabase = createAdminClient()
  let findings: IntegrityFinding[]
  try {
    findings = await runIntegrityChecks(supabase)
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }

  // Only escalate high/med via email; low is dashboard-only noise.
  const escalate = findings.filter((f) => f.severity === 'high' || f.severity === 'med')
  const counts = {
    high: findings.filter((f) => f.severity === 'high').length,
    med: findings.filter((f) => f.severity === 'med').length,
    low: findings.filter((f) => f.severity === 'low').length,
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const subject = escalate.length
      ? `Data integrity: ${escalate.length} issue${escalate.length === 1 ? '' : 's'} flagged (${counts.high} high, ${counts.med} med)`
      : `Data integrity: clean${counts.low ? ` (${counts.low} low-pri notes)` : ''}`
    const rows = escalate
      .map(
        (f) =>
          `<li style="margin:4px 0"><b>[${f.severity}]</b> <code>${f.check}</code>${f.programSlug ? ` &mdash; <b>${f.programSlug}</b>` : ''}: ${f.detail}</li>`,
      )
      .join('')
    const body = escalate.length
      ? `<p>The daily data-integrity audit flagged <b>${escalate.length}</b> issue(s) in the program/transfer graph. Review at <a href="https://www.crazy4points.com/admin/data-integrity">/admin/data-integrity</a>.</p><ul>${rows}</ul>`
      : `<p>The daily data-integrity audit found no high/medium issues${counts.low ? ` (${counts.low} low-priority notes on the dashboard)` : ''}. All clean.</p>`
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
        to: 'jillzeller6@gmail.com',
        subject,
        html: body,
      })
    } catch {
      // Email failure shouldn't fail the cron; the JSON response still reports.
    }
  }

  return NextResponse.json({ ok: true, counts, findings })
}
