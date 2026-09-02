/**
 * Nightly intel auto-clear — rejects undecided intel that provably needs no human
 * decision (already-covered / expired / aged-out email forwards), so the Phase 4
 * triage queue stays small instead of silently accumulating (Jill, 2026-09-02).
 * Reversible (sets rejected_at + reason). Skips alert-update items. Runs before the
 * morning crons so the ritual opens to a drained queue.
 *
 * Schedule: daily, early (see vercel.json). Auth: Vercel Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { runAutoclear } from '@/utils/intel/autoclear'
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
  const result = await runAutoclear(supabase, { apply: true })
  console.log(`[intel-autoclear] undecided=${result.undecided} cleared=${result.cleared} (expired=${result.expired} covered=${result.covered} aged=${result.aged_email})`)
  return NextResponse.json({ ok: true, ...result })
}
