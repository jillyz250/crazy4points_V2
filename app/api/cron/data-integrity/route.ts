/**
 * Daily data-integrity audit for the program/transfer graph.
 *
 * Layer 0 of the data-accuracy plan: cheap deterministic structural checks
 * (orphan/junk slugs, bad ratio formats, deprecated dupe rows, missing currency
 * flags). No LLM, no web - just the shape of our own data. Findings are surfaced
 * by the Daily Data Digest (high/med) and at /admin/data-integrity; this cron
 * still runs daily to log a cron_runs heartbeat + power the dashboard freshness.
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET} + x-vercel-cron header.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { runIntegrityChecks, type IntegrityFinding } from '@/utils/integrity/runIntegrityChecks'
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

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied

  const supabase = createAdminClient()
  const runId = await startCronRun(supabase, 'data-integrity')
  let findings: IntegrityFinding[]
  try {
    findings = await runIntegrityChecks(supabase)
  } catch (err) {
    await finishCronRun(supabase, runId, { status: 'failed', error: String(err) })
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }

  // high/med are the digest-worthy findings; low is dashboard-only noise.
  const escalate = findings.filter((f) => f.severity === 'high' || f.severity === 'med')
  const counts = {
    high: findings.filter((f) => f.severity === 'high').length,
    med: findings.filter((f) => f.severity === 'med').length,
    low: findings.filter((f) => f.severity === 'low').length,
  }

  // Notification is handled centrally by the Daily Data Digest
  // (app/api/cron/daily-digest), which runs these checks live and renders the
  // high/med findings. This cron persists only its cron_runs heartbeat.

  await finishCronRun(supabase, runId, {
    status: 'success',
    recordsChecked: findings.length,
    recordsChanged: escalate.length,
  })
  return NextResponse.json({ ok: true, counts, findings })
}
