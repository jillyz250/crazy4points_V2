/**
 * Daily backstop cron — recomputes content_variants.surface_locations for
 * every published alert. Catches drift the BEFORE INSERT/UPDATE trigger on
 * content_variants can't catch (e.g. topics.programs or topics.end_date
 * changing without the variant being touched).
 *
 * Scheduled in vercel.json at 07:30 UTC (right after the nightly-snapshot
 * cron at 07:00 so we have a fresh backup if anything goes sideways).
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET}.
 *
 * Cost: a single SQL UPDATE. Currently 0 rows in content_variants so this
 * is a no-op until Phase 3 backfills.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
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
  const { data, error } = await supabase.rpc('recompute_all_surface_locations')

  if (error) {
    console.error('[recompute-surface-locations] rpc error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const rowsUpdated = typeof data === 'number' ? data : 0
  console.log(`[recompute-surface-locations] updated ${rowsUpdated} variants`)
  return NextResponse.json({ ok: true, rows_updated: rowsUpdated })
}
