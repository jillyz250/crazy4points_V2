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
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { scanAnnouncements } from '@/utils/integrity/scanAnnouncements'
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
  let signals
  try {
    signals = await scanAnnouncements(supabase)
  } catch (err) {
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

  // Email only NEW signals (and only if any) so the inbox stays signal-rich.
  if (fresh.length && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const rows = fresh
      .map(
        (s) =>
          `<li style="margin:6px 0"><b>[${s.confidence}] ${s.signalType}</b>${s.programSlug ? ` &mdash; <b>${s.programSlug}</b>` : ''}: ${s.summary}<br><a href="${s.sourceUrl}">${s.sourceName}</a></li>`,
      )
      .join('')
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
        to: 'jillzeller6@gmail.com',
        subject: `Change monitor: ${fresh.length} new transfer signal${fresh.length === 1 ? '' : 's'} to review`,
        html: `<p>The announcement monitor found <b>${fresh.length}</b> new potential change(s) to transfer partners/ratios. Review against our data at <a href="https://www.crazy4points.com/admin/change-signals">/admin/change-signals</a>.</p><ul>${rows}</ul>`,
      })
    } catch {
      /* email failure shouldn't fail the cron */
    }
  }

  return NextResponse.json({ ok: true, scanned: signals.length, new: fresh.length })
}
