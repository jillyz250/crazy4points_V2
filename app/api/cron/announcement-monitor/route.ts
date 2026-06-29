/**
 * Daily external announcement monitor (data-accuracy plan, Layer 1).
 *
 * Scrapes curated issuer newsrooms + points-blog news pages, Haiku-classifies
 * any transfer-partner / award-ratio CHANGES affecting programs we track, and
 * upserts them into change_signals for review at /admin/change-signals. Emails
 * Jill only the NEW signals (dedup by content_hash bumps last_seen_at instead).
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET} + x-vercel-cron header.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { scanAnnouncements } from '@/utils/integrity/scanAnnouncements'
import { startCronRun, finishCronRun } from '@/lib/cron/recordRun'
import { assertCron } from '@/lib/auth/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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
  const runId = await startCronRun(supabase, 'announcement-monitor')
  let signals
  try {
    signals = await scanAnnouncements(supabase)
  } catch (err) {
    await finishCronRun(supabase, runId, { status: 'failed', error: String(err) })
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }

  // Which hashes already exist (so we only email genuinely new ones).
  const hashes = signals.map((s) => s.contentHash)
  const existing = new Set<string>()
  if (hashes.length) {
    const { data } = await supabase.from('change_signals').select('content_hash').in('content_hash', hashes)
    for (const r of (data ?? []) as Array<{ content_hash: string }>) existing.add(r.content_hash)
  }
  const fresh = signals.filter((s) => !existing.has(s.contentHash))

  // Upsert all: new rows inserted, seen rows bump last_seen_at.
  if (signals.length) {
    const now = new Date().toISOString()
    await supabase.from('change_signals').upsert(
      signals.map((s) => ({
        content_hash: s.contentHash,
        source_name: s.sourceName,
        source_url: s.sourceUrl,
        program_slug: s.programSlug,
        signal_type: s.signalType,
        summary: s.summary,
        excerpt: s.excerpt,
        confidence: s.confidence,
        last_seen_at: now,
      })),
      { onConflict: 'content_hash', ignoreDuplicates: false },
    )
  }

  // Notification is handled centrally by the Daily Data Digest
  // (app/api/cron/daily-digest) — this monitor only detects + persists.

  await finishCronRun(supabase, runId, {
    status: 'success',
    recordsChecked: signals.length,
    recordsChanged: fresh.length,
  })
  return NextResponse.json({ ok: true, scanned: signals.length, new: fresh.length })
}
