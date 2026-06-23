/**
 * Daily stale alert-draft hygiene.
 *
 * Hard-rejects Scout alert drafts left unreviewed for >21 days (stale news), so
 * the "Pending review" count reflects genuinely reviewable drafts. Snoozed
 * drafts are never touched. See sweepStaleAlertDrafts.
 *
 * Schedule: daily at 10:55 UTC (see vercel.json) — with the other post-brief
 * queue sweeps.
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { sweepStaleAlertDrafts } from '@/utils/content/sweepStaleAlertDrafts'
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
  const result = await sweepStaleAlertDrafts(supabase)
  console.log(`[stale-drafts-sweep] rejected=${result.rejected} errors=${result.errors}`)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
