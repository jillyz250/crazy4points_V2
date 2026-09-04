/**
 * Sweet-spot recheck guardrail (Jill, 2026-09-04).
 *
 * A sweet spot is the FIRST thing a devaluation kills. This cron ties the
 * existing devaluation detection (change_signals: devaluation / ratio_change)
 * to the sweet_spots table: when a program's award pricing changes, every sweet
 * spot that redeems through that program is FLAGGED for re-verification
 * (recheck_flagged_at). Priya then re-checks the flagged ones against the
 * program's official chart and clears the flag (or updates/retires the spot).
 *
 * This is the "constantly accurate" mechanism — automatic, not manual, so a
 * devalued sweet spot can't sit live and wrong. See the sweet-spots system +
 * feedback_never_an_open_loop.
 *
 * Idempotent: only flags sweet spots not already flagged. Vercel cron; auth via
 * CRON_SECRET.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { logEmployeeActivity } from '@/utils/org/logEmployeeActivity'
import { assertCron } from '@/lib/auth/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEVAL_TYPES = ['devaluation', 'ratio_change']

export async function GET(request: Request) {
  return handle(request)
}
export async function POST(request: Request) {
  return handle(request)
}

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied
  const db = createAdminClient()

  // 1. Programs with an open devaluation / ratio-change signal.
  const { data: signals } = await db
    .from('change_signals')
    .select('program_slug, signal_type')
    .in('signal_type', DEVAL_TYPES)
    .neq('status', 'dismissed')
  const slugs = Array.from(new Set((signals ?? []).map((s) => s.program_slug).filter(Boolean))) as string[]
  if (slugs.length === 0) {
    return NextResponse.json({ ok: true, flagged: 0, reason: 'no open devaluation signals' })
  }

  // 2. Flag each program's still-unflagged active sweet spots (matched by the
  //    program the redemption runs through: program_slug OR operating_partner).
  const now = new Date().toISOString()
  let flagged = 0
  for (const slug of slugs) {
    const { data: hits } = await db
      .from('sweet_spots')
      .update({ recheck_flagged_at: now, recheck_reason: `Program devaluation/ratio change detected for ${slug}` })
      .or(`program_slug.eq.${slug},operating_partner.eq.${slug}`)
      .is('recheck_flagged_at', null)
      .eq('status', 'active')
      .select('id')
    flagged += hits?.length ?? 0
  }

  if (flagged > 0) {
    await logEmployeeActivity(db, {
      employee_slug: 'priya-sources',
      action: 'reviewed',
      summary: `Sweet-spot guard flagged ${flagged} sweet spot(s) for re-verification after a program devaluation. Re-check them vs the official chart.`,
      ref_type: 'other',
      link: '/admin/accuracy',
    })
    console.log(`[sweet-spot-recheck-guard] flagged ${flagged} across ${slugs.length} devalued program(s)`)
  }

  return NextResponse.json({ ok: true, flagged, programs: slugs.length })
}
