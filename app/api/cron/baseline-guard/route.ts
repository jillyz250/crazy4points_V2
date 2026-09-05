/**
 * Weekly baseline guard (Jill, 2026-09-05). Ensures every current card bonus has
 * a baseline no matter how it was added (the extraction flow sets it, but manual
 * paths can miss it). Auto-seeds non-elevated ones; returns elevated-without-
 * baseline for a human to research. Auth via CRON_SECRET.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { baselineGuard } from '@/lib/cards/baselineGuard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied
  const db = createAdminClient()
  const result = await baselineGuard(db, { apply: true })
  return NextResponse.json({ ok: true, ...result })
}
