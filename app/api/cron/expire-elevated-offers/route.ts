/**
 * Daily: auto-revert elevated welcome-bonus offers whose limited-time window has
 * closed, so a stale "Elevated offer" badge + credit line can never linger on a
 * card page. See utils/integrity/expireElevatedOffers.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { expireElevatedOffers } from '@/utils/integrity/expireElevatedOffers'
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
  const result = await expireElevatedOffers(supabase)
  if (result.reverted > 0) {
    console.log(`[expire-elevated-offers] reverted ${result.reverted}: ${result.cards.join(', ')}`)
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
