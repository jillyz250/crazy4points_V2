/**
 * Daily welcome-bonus monitor.
 *
 * Scrapes each active card's welcome-bonus source_url, Haiku-extracts the
 * CURRENT sign-up bonus, and flags any card whose live offer differs from what
 * we have stored. Upserts into card_bonus_signals for review at
 * /admin/card-bonus-signals. Emails Jill only the NEW signals (dedup by
 * content_hash bumps last_seen_at instead). Flag-for-review only - never edits.
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET} + x-vercel-cron header.
 */
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { scanCardBonuses } from '@/utils/integrity/scanCardBonuses'
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
    signals = await scanCardBonuses(supabase)
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }

  // Which hashes already exist (so we only email genuinely new ones).
  const hashes = signals.map((s) => s.contentHash)
  const existing = new Set<string>()
  if (hashes.length) {
    const { data } = await supabase.from('card_bonus_signals').select('content_hash').in('content_hash', hashes)
    for (const r of (data ?? []) as Array<{ content_hash: string }>) existing.add(r.content_hash)
  }
  const fresh = signals.filter((s) => !existing.has(s.contentHash))

  // Upsert all: new rows inserted, seen rows bump last_seen_at.
  if (signals.length) {
    const now = new Date().toISOString()
    await supabase.from('card_bonus_signals').upsert(
      signals.map((s) => ({
        content_hash: s.contentHash,
        card_id: s.cardId,
        card_slug: s.cardSlug,
        card_name: s.cardName,
        source_url: s.sourceUrl,
        bonus_currency: s.bonusCurrency,
        stored_amount: s.storedAmount,
        stored_spend: s.storedSpend,
        detected_amount: s.detectedAmount,
        detected_spend: s.detectedSpend,
        summary: s.summary,
        confidence: s.confidence,
        last_seen_at: now,
      })),
      { onConflict: 'content_hash', ignoreDuplicates: false },
    )
  }

  // Email only NEW signals so the inbox stays signal-rich.
  if (fresh.length && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const rows = fresh
      .map(
        (s) =>
          `<li style="margin:6px 0"><b>[${s.confidence}]</b> ${s.summary}<br><a href="${s.sourceUrl}">source</a></li>`,
      )
      .join('')
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
        to: 'jillzeller6@gmail.com',
        subject: `Welcome-bonus monitor: ${fresh.length} card${fresh.length === 1 ? '' : 's'} changed`,
        html: `<p>The welcome-bonus monitor found <b>${fresh.length}</b> card(s) whose live sign-up bonus differs from our data. Review + apply at <a href="https://www.crazy4points.com/admin/card-bonus-signals">/admin/card-bonus-signals</a>.</p><ul>${rows}</ul>`,
      })
    } catch {
      /* email failure shouldn't fail the cron */
    }
  }

  return NextResponse.json({ ok: true, scanned: signals.length, new: fresh.length })
}
