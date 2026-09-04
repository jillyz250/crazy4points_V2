/**
 * Weekly backup reminder cron.
 *
 * Every Friday, drop a reminder into Jill's task list to download the latest
 * DB backup to her own machine — the air-gapped 3rd copy (independent of both
 * Supabase and Gmail). The automated off-site email (nightly-snapshot on
 * Fridays) is the 2nd copy; this manual download is the belt-and-suspenders
 * 3rd, living on no cloud at all.
 *
 * Idempotent: skips if an OPEN backup-download reminder already exists (so a
 * retry or a double-invoke never stacks duplicates).
 *
 * Vercel cron: Fridays 13:00 UTC (~9am ET). Auth via CRON_SECRET.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const TITLE = 'Download the latest DB backup to your Mac (air-gapped copy)'
const NOTES =
  'Weekly safety net (Bill). Open /admin/backups and download the newest snapshot to your own machine — a copy that lives on no cloud. The Friday off-site email is the 2nd copy; this is the 3rd. Dismiss once downloaded.'

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

  // Idempotent guard: is there already an open backup-download reminder?
  const { data: existing } = await supabase
    .from('reminders')
    .select('id')
    .eq('title', TITLE)
    .neq('status', 'done')
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: true, created: false, reason: 'open reminder already exists' })
  }

  const dueDate = new Date().toISOString().slice(0, 10)
  const { data: inserted, error } = await supabase
    .from('reminders')
    .insert({
      title: TITLE,
      notes: NOTES,
      due_date: dueDate,
      status: 'todo',
      link: '/admin/backups',
      kind: 'todo',
    })
    .select('id')
    .single()

  if (error || !inserted) {
    console.error('[backup-reminder] insert failed:', error?.message)
    return NextResponse.json({ ok: false, error: error?.message ?? 'insert failed' }, { status: 500 })
  }

  console.log('[backup-reminder] created reminder', inserted.id)
  return NextResponse.json({ ok: true, created: true, reminderId: inserted.id })
}
