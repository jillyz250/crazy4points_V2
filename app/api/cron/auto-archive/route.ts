/**
 * Phase 5 — Daily auto-archive cron.
 *
 * Flips published alert variants to `archived` (with metadata.archive_reason
 * ='auto-expired') 30 days after their topic.end_date. URL still resolves —
 * the alert just falls out of any "active" list.
 *
 * Runs once daily so the grace window is consistent: an alert that ended on
 * 2026-06-01 gets archived no earlier than 2026-07-01 00:00 UTC.
 *
 * Schedule: daily at 07:15 UTC (see vercel.json) — after nightly snapshot.
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { autoArchiveExpiredVariants } from '@/utils/lifecycle/autoArchive'
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
  const result = await autoArchiveExpiredVariants(supabase)
  console.log(`[auto-archive] scanned=${result.scanned} archived=${result.archived} errors=${result.errors}`)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
