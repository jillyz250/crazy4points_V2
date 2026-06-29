/**
 * Weekly transfer-data re-verification sweep (data-accuracy plan, Layer 3).
 *
 * Scrapes a roster source for each program we maintain transfer data on, has the
 * model compare it to our stored transfer_partners_outbound, and upserts
 * GHOST / MISSING / WRONG_RATIO findings into verification_findings for review at
 * /admin/verification-findings. Emails the NEW findings each run.
 *
 * Processes up to N programs per run (oldest-reverified first) so cost/time stay
 * bounded as the source list grows. Detection only - never edits program data.
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET} + x-vercel-cron header.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { reverifyDue } from '@/utils/integrity/reverifyTransfers'
import { startCronRun, finishCronRun } from '@/lib/cron/recordRun'
import { assertCron } from '@/lib/auth/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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
  const runId = await startCronRun(supabase, 'reverify')
  let findings
  try {
    findings = await reverifyDue(supabase, 8)
  } catch (err) {
    await finishCronRun(supabase, runId, { status: 'failed', error: String(err) })
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }

  const hashes = findings.map((f) => f.contentHash)
  const existing = new Set<string>()
  if (hashes.length) {
    const { data } = await supabase.from('verification_findings').select('content_hash').in('content_hash', hashes)
    for (const r of (data ?? []) as Array<{ content_hash: string }>) existing.add(r.content_hash)
  }
  const fresh = findings.filter((f) => !existing.has(f.contentHash))

  if (findings.length) {
    const now = new Date().toISOString()
    await supabase.from('verification_findings').upsert(
      findings.map((f) => ({
        content_hash: f.contentHash,
        program_slug: f.programSlug,
        partner_slug: f.partnerSlug,
        partner_name: f.partnerName,
        finding_type: f.findingType,
        ours: f.ours,
        theirs: f.theirs,
        source_label: f.sourceLabel,
        source_url: f.sourceUrl,
        confidence: f.confidence,
        summary: f.summary,
        last_seen_at: now,
      })),
      { onConflict: 'content_hash', ignoreDuplicates: false },
    )
  }

  // Notification is handled centrally by the Daily Data Digest
  // (app/api/cron/daily-digest) — this sweep only detects + persists.

  await finishCronRun(supabase, runId, {
    status: 'success',
    recordsChecked: findings.length,
    recordsChanged: fresh.length,
  })
  return NextResponse.json({ ok: true, produced: findings.length, new: fresh.length })
}
