/**
 * Daily content-ideas queue hygiene.
 *
 * Ages stale 'new' content ideas (>30 days) into 'idea_bank' so the dashboard
 * "Open content ideas" count reflects fresh, actionable ideas instead of the
 * whole accumulated firehose. Ideas are kept, never deleted. See
 * sweepStaleContentIdeas.
 *
 * Schedule: daily at 10:50 UTC (see vercel.json) — alongside the other
 * post-brief queue sweeps.
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { sweepStaleContentIdeas } from '@/utils/content/sweepStaleContentIdeas'
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
  const result = await sweepStaleContentIdeas(supabase)
  console.log(`[content-ideas-sweep] movedToIdeaBank=${result.movedToIdeaBank} errors=${result.errors}`)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
