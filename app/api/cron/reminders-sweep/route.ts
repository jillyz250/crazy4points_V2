/**
 * Nightly reminders sweep — auto-completes dead reminders (past-close auctions +
 * ended-deal "before it ends" rows) so the morning ritual's Phase 2 starts clean
 * instead of buried under a graveyard of stale reminders. Live deals + evergreen
 * "Social post:" reminders are always kept (see sweepDeadReminders).
 *
 * Schedule: daily at 09:30 UTC (before the ~10:00 UTC morning crons; see vercel.json).
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { sweepDeadReminders } from '@/utils/lifecycle/sweepDeadReminders'
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
  const result = await sweepDeadReminders(supabase, { apply: true })
  console.log(
    `[reminders-sweep] past-due=${result.pastDue} completed=${result.completed} kept=${result.kept}`,
  )
  return NextResponse.json({ ok: true, ...result })
}
