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
import { draftApprovedIntel } from '@/utils/intel/draftFromIntel'
import { assertCron } from '@/lib/auth/cron'

export const dynamic = 'force-dynamic'
// Auto-drafting runs writeEditCheck (writer -> editor -> voice) per item, which
// is ~50-60s each, so give the function real headroom.
export const maxDuration = 300

// Cap approved-intel auto-drafts per run. Kept low because each draft is slow
// (~1 min); the loop is self-healing (an item is marked processed only after
// its draft lands, so a timeout mid-run just retries), so any remainder simply
// rolls to the next daily run. Raise only if the plan's function limit allows.
const AUTO_DRAFT_CAP = 3

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

  // 1) Clean up decided intel (rejected / expired / stale newsletter ideas).
  const result = await sweepTriagedIntel(supabase)
  console.log(`[intel-triage-sweep] rejectedCleared=${result.rejectedCleared} expiredArchived=${result.expiredArchived} newsletterIdeaArchived=${result.newsletterIdeaArchived} errors=${result.errors}`)

  // 2) Auto-draft AI-approved intel (bounded) so 'approved' actually flows to
  //    the drafts table instead of rotting at processed=false.
  let autoDraft = { drafted: 0, errors: 0, attempted: 0 }
  try {
    autoDraft = await draftApprovedIntel(supabase, { cap: AUTO_DRAFT_CAP })
    console.log(`[intel-triage-sweep] autoDraft drafted=${autoDraft.drafted} attempted=${autoDraft.attempted} errors=${autoDraft.errors}`)
  } catch (err) {
    console.error('[intel-triage-sweep] auto-draft step failed:', err instanceof Error ? err.message : err)
    autoDraft = { ...autoDraft, errors: autoDraft.errors + 1 }
  }

  const ok = result.ok && autoDraft.errors === 0
  return NextResponse.json({ ...result, autoDraft }, { status: ok ? 200 : 500 })
}
