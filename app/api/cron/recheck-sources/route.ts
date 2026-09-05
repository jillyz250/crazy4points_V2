/**
 * Weekly source-health cron (Jill, 2026-09-05). Auto-finds + fixes broken
 * monitoring sources so "everything is working-or-flagged" stays true without
 * anyone running it by hand. Processes a rotating batch (least-recently-touched
 * first); truly-gone URLs get flagged NEEDS URL FIX and escalate in the aging
 * monitor for a human hunt. Auth via CRON_SECRET.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { recheckSources } from '@/lib/sources/recheckSources'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied
  const db = createAdminClient()
  const summary = await recheckSources(db, { limit: 40, apply: true, timeoutMs: 6000 })
  return NextResponse.json({ ok: true, ...summary })
}
