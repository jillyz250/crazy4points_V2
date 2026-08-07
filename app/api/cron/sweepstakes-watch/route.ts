/**
 * Sweepstakes watch — daily scrape of points/miles sweepstakes pages.
 *
 * For each active `sweepstakes_sources` row: scrape (Firecrawl), extract the
 * live sweepstakes (Haiku), upsert into `sweepstakes`, and end ones that
 * vanished. Each running sweepstakes is a Facebook-post candidate — the admin
 * dashboard surfaces the count + a "needs a social post" flag.
 *
 * Schedule: daily (vercel.json). Auth: assertCron (CRON_SECRET).
 * Manual run: curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/sweepstakes-watch
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { runSweepstakesWatch } from '@/utils/sweepstakes/runSweepstakesWatch'

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
  try {
    const supabase = createAdminClient()
    const result = await runSweepstakesWatch(supabase)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[sweepstakes-watch] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
