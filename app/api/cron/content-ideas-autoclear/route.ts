/**
 * Nightly content-ideas auto-clear — dismisses backlog ideas that need no human:
 * already-covered (matches a published guide/blog/alert), stale (unwritten >90d),
 * or dupes. Keeps the roadmap backlog from re-accumulating (Jill, 2026-09-02: it had
 * grown to 770). Reversible (status='dismissed'). Runs early, before the ritual.
 *
 * Schedule: daily (see vercel.json). Auth: Vercel Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { runContentIdeasAutoclear } from '@/utils/content/contentIdeasAutoclear'
import { assertCron } from '@/lib/auth/cron'

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

  const supabase = createAdminClient()
  const result = await runContentIdeasAutoclear(supabase, { apply: true })
  console.log(`[content-ideas-autoclear] considered=${result.considered} cleared=${result.cleared} (covered=${result.covered} stale=${result.stale} dupe=${result.dupe}) remaining=${result.remaining}`)
  return NextResponse.json({ ok: true, ...result })
}
