/**
 * Experiences availability — daily re-check of whether active listings sold out.
 *
 * The watch (experiences-watch) tracks whether a listing still appears in a
 * program's catalog, but not whether its detail page has sold out while still
 * listed (common on Marriott Bonvoy Moments). This fetches each active
 * redeem/access listing's detail page and sets sold_out, so the finder can flag
 * and demote sold-out experiences instead of sending users to a dead end.
 *
 * Bounded per run (oldest-checked first) so the ~75-listing catalog sweeps over
 * a couple of runs. Schedule: daily (vercel.json). Auth: assertCron (CRON_SECRET).
 */
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { runAvailabilitySweep } from '@/utils/experiences/checkListingAvailability'

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
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const result = await runAvailabilitySweep(supabase, anthropic, { limit: 40, concurrency: 6 })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[experiences-availability] failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
