/**
 * Daily intel triage self-cleaning sweep.
 *
 * Applies AI 'rejected' triage decisions after a 3-day grace and archives
 * expired intel, so the triage queue (and the dashboard count) reflects items
 * that actually need a human — not phantom backlog. See sweepTriagedIntel.
 *
 * Schedule: daily at 10:45 UTC (see vercel.json) — right after build-brief
 * (10:30) writes the day's fresh triage decisions.
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { sweepTriagedIntel } from '@/utils/intel/sweepTriagedIntel'
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
  const result = await sweepTriagedIntel(supabase)
  console.log(`[intel-triage-sweep] rejectedCleared=${result.rejectedCleared} expiredArchived=${result.expiredArchived} newsletterIdeaArchived=${result.newsletterIdeaArchived} errors=${result.errors}`)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
