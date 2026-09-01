/**
 * Daily social-calendar generator — rolls the recurring anchors (Bilt Rent Day,
 * Chase/Discover quarterly categories, etc.) forward ~8 weeks into `social_calendar`
 * as `suggested` rows (the "Recommended" lane). Idempotent, so it only ever adds
 * newly-in-range slots and never re-suggests one Jill already promoted or skipped.
 *
 * Schedule: daily (see vercel.json). Auth: Vercel Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { runAnchorGeneration } from '@/utils/social/generateCalendar'
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
  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const result = await runAnchorGeneration(supabase, todayET, 8)
  console.log(`[social-calendar] considered=${result.considered} inserted=${result.inserted}`)
  return NextResponse.json({ ok: true, ...result })
}
