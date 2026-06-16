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
import { createAdminClient } from '@/utils/supabase/server'
import { createSnapshot } from '@/utils/backups/createSnapshot'
import { assertCron } from '@/lib/auth/cron'

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
  return NextResponse.json({
    ok: true,
    snapshotId: result.snapshotId,
    storagePath: result.storagePath,
    sizeBytes: result.sizeBytes,
    durationMs: result.durationMs,
    rowCounts: result.rowCounts,
  })
}
