/**
 * Nightly database snapshot cron.
 *
 * Triggered by Vercel cron at 07:00 UTC (= 2-3am US Eastern, depending on DST).
 * Doesn't matter when locally — Jill's Mac doesn't need to be on, this runs
 * on Vercel's servers.
 *
 * Calls the shared createSnapshot logic (same code path as the admin "Take
 * snapshot now" button and any future CLI invocation).
 *
 * Cost: free. The snapshot is ~few-MB gzipped JSON in Supabase Storage.
 * Free Supabase tier has 1 GB of storage; at ~5 MB/snapshot we have headroom
 * for ~200 snapshots before we'd need to start pruning.
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET} when invoking.
 */

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { createSnapshot } from '@/utils/backups/createSnapshot'
import { logEmployeeActivity } from '@/utils/org/logEmployeeActivity'
import { assertCron } from '@/lib/auth/cron'

/**
 * Off-provider safety net: once a week (Fridays UTC), email the gzipped
 * snapshot to Jill so a full copy of the editorial DB lives OUTSIDE Supabase
 * (in her Gmail = a different provider). The nightly copy in Supabase Storage
 * is the primary; this is the independent 2nd copy Bill flagged as the gap.
 * Weekly (not nightly) to avoid inbox clutter; contains the subscriber list,
 * so it only ever goes to Jill's own address.
 */
async function emailOffsiteCopy(gz: Buffer, sizeBytes: number, rowCounts: Record<string, number>) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { emailed: false, reason: 'no RESEND_API_KEY' }
  const resend = new Resend(apiKey)
  const date = new Date().toISOString().slice(0, 10)
  const subs = rowCounts.subscribers ?? '?'
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
    to: process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com',
    subject: `Crazy4Points OFF-SITE DB backup — ${date}`,
    html: `<p>Weekly off-provider copy of the editorial database (independent of Supabase).</p>
<p><strong>${(sizeBytes / 1024).toFixed(0)} KB</strong> gzip &middot; ${subs} subscribers &middot; ${Object.keys(rowCounts).length} tables.</p>
<p>Keep this email; it is the 2nd copy. To restore, unzip the attachment and follow RESTORE.md. A fresh copy arrives every Friday.</p>`,
    attachments: [{ filename: `c4p-backup-${date}.json.gz`, content: gz }],
  })
  if (error) return { emailed: false, reason: error.message }
  return { emailed: true }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
  const result = await createSnapshot({
    supabase,
    label: 'nightly-cron',
    takenBy: 'cron:vercel',
    notes: 'Automated nightly snapshot.',
  })

  if (!result.ok) {
    console.error('[nightly-snapshot] failed:', result.error)
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  console.log(
    `[nightly-snapshot] ${result.snapshotId} → ${result.storagePath} (${(result.sizeBytes / 1024).toFixed(1)} KB, ${result.durationMs}ms)`,
  )

  // Weekly off-site copy: Fridays (UTC day 5), or on demand with ?email=1.
  const forceEmail = new URL(request.url).searchParams.get('email') === '1'
  const isFriday = new Date().getUTCDay() === 5
  let offsite: { emailed: boolean; reason?: string } = { emailed: false, reason: 'not scheduled' }
  if (isFriday || forceEmail) {
    offsite = await emailOffsiteCopy(result.gzBuffer, result.sizeBytes, result.rowCounts)
    if (!offsite.emailed) console.error('[nightly-snapshot] off-site email failed:', offsite.reason)
    else {
      console.log('[nightly-snapshot] off-site copy emailed')
      // Self-populate Bill's activity chain (weekly, not spammy) so his page
      // reflects real security/ops work instead of looking idle.
      await logEmployeeActivity(supabase, {
        employee_slug: 'bill-security',
        action: 'shipped',
        summary: `Off-site DB backup delivered (${(result.sizeBytes / 1024).toFixed(0)} KB, ${result.rowCounts.subscribers ?? '?'} subscribers) — the weekly off-provider copy.`,
        ref_type: 'other',
        link: '/admin/backups',
      })
    }
  }

  return NextResponse.json({
    ok: true,
    snapshotId: result.snapshotId,
    storagePath: result.storagePath,
    sizeBytes: result.sizeBytes,
    durationMs: result.durationMs,
    rowCounts: result.rowCounts,
    offsiteEmailed: offsite.emailed,
  })
}
