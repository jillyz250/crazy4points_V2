/**
 * Phase 5 — Hourly auto-expire cron.
 *
 * Touches `updated_at` on every published alert variant whose parent topic
 * has ended. The variants→alerts trigger then re-projects the derived
 * `alerts.status='expired'` state, hiding the alert from active surfaces.
 *
 * Variant state stays `published` until the daily auto-archive job moves it
 * to `archived` (30 days after end_date).
 *
 * Schedule: every hour at :05 (see vercel.json).
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { autoExpirePublishedVariants, autoRejectExpiredDrafts } from '@/utils/lifecycle/autoExpire'
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
  const published = await autoExpirePublishedVariants(supabase)
  const expiredDrafts = await autoRejectExpiredDrafts(supabase)
  console.log(
    `[auto-expire] published: scanned=${published.scanned} touched=${published.touched} errors=${published.errors} | ` +
    `expired-drafts: scanned=${expiredDrafts.scanned} rejected=${expiredDrafts.rejected} errors=${expiredDrafts.errors}`,
  )
  return NextResponse.json(
    { published, expiredDrafts },
    { status: published.ok && expiredDrafts.ok ? 200 : 500 },
  )
}
