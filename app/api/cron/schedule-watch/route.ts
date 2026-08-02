/**
 * Schedule-open watcher — daily check of chunk-dropping airlines (Southwest, and
 * later Alaska). When an airline extends its bookable schedule, drop a dashboard
 * reminder with a ready-to-post Facebook draft + an explicit "boost" step; when
 * a new extension is pre-announced, drop a heads-up reminder.
 *
 * Schedule: daily (vercel.json). Auth: assertCron (CRON_SECRET).
 */
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { runScheduleWatch } from '@/utils/schedule-watch/runScheduleWatch'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

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
    const results = await runScheduleWatch(supabase, anthropic)
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[schedule-watch] failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
