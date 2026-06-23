/**
 * Transfer-bonus detection monitor — the missing detection half of the
 * self-expiring bonus system.
 *
 * Scrapes the dedicated "current transfer bonuses" aggregator pages, diffs the
 * live list against our bonus_active flags, and upserts change_signals
 * (signal_type='transfer_bonus') for bonuses we're MISSING. Emails Jill only the
 * NEW ones. Detection only — you confirm + flag bonus_active with an end date
 * (which then auto-expires). See scanTransferBonuses.
 *
 * Schedule: every 3 days at 12:00 UTC (see vercel.json).
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET}.
 */
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { scanTransferBonuses } from '@/utils/integrity/scanTransferBonuses'
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
    signals = await scanTransferBonuses(supabase)
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }

  const hashes = signals.map((s) => s.contentHash)
  const existing = new Set<string>()
  if (hashes.length) {
    const { data } = await supabase.from('change_signals').select('content_hash').in('content_hash', hashes)
    for (const r of (data ?? []) as Array<{ content_hash: string }>) existing.add(r.content_hash)
  }
  const fresh = signals.filter((s) => !existing.has(s.contentHash))

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

  if (fresh.length && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const rows = fresh
      .map((s) => `<li style="margin:6px 0"><b>[${s.confidence}]</b> ${s.summary}${s.excerpt ? `<br><i>${s.excerpt}</i>` : ''}</li>`)
      .join('')
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
        to: 'jillzeller6@gmail.com',
        subject: `Transfer-bonus monitor: ${fresh.length} bonus${fresh.length === 1 ? '' : 'es'} we're missing`,
        html: `<p>The transfer-bonus monitor found <b>${fresh.length}</b> live transfer bonus(es) not flagged in our data. Confirm + set bonus_active with an end date at <a href="https://www.crazy4points.com/admin/change-signals">/admin/change-signals</a>.</p><ul>${rows}</ul>`,
      })
    } catch {
      /* email failure shouldn't fail the cron */
    }
  }

  return NextResponse.json({ ok: true, scanned: signals.length, new: fresh.length })
}
