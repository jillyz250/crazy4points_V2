import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import type { CardBonusSignal } from './scanCardBonuses'

/**
 * Shared persistence for welcome-bonus signals — used by BOTH the daily
 * scanCardBonuses cron and the Firecrawl Monitor webhook. The content_hash
 * formula is byte-identical to scanCardBonuses.hash(), so a change detected by
 * either path upserts to the SAME row (no duplicates during the parallel run).
 */

// djb2 — must stay identical to the private hash() in scanCardBonuses.ts.
export function signalHash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export function signalContentHash(cardId: string, amount: number | null, spend: number | null): string {
  return signalHash(`${cardId}|${amount}|${spend ?? ''}`)
}

/**
 * Upsert signals (new rows inserted, seen rows bump last_seen_at) and return the
 * ones that are genuinely NEW (so callers email only those).
 */
export async function persistCardBonusSignals(
  supabase: SupabaseClient,
  signals: CardBonusSignal[],
): Promise<CardBonusSignal[]> {
  if (!signals.length) return []

  const hashes = signals.map((s) => s.contentHash)
  const existing = new Set<string>()
  const { data } = await supabase.from('card_bonus_signals').select('content_hash').in('content_hash', hashes)
  for (const r of (data ?? []) as Array<{ content_hash: string }>) existing.add(r.content_hash)
  const fresh = signals.filter((s) => !existing.has(s.contentHash))

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
  return fresh
}

/** Email only the NEW signals so the inbox stays signal-rich. */
export async function emailFreshSignals(fresh: CardBonusSignal[], via: string): Promise<void> {
  if (!fresh.length || !process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const rows = fresh
    .map((s) => `<li style="margin:6px 0"><b>[${s.confidence}]</b> ${s.summary}<br><a href="${s.sourceUrl}">source</a></li>`)
    .join('')
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
      to: 'jillzeller6@gmail.com',
      subject: `Welcome-bonus monitor (${via}): ${fresh.length} card${fresh.length === 1 ? '' : 's'} changed`,
      html: `<p>The welcome-bonus monitor (${via}) found <b>${fresh.length}</b> card(s) whose live sign-up bonus differs from our data. Review + apply at <a href="https://www.crazy4points.com/admin/card-bonus-signals">/admin/card-bonus-signals</a>.</p><ul>${rows}</ul>`,
    })
  } catch {
    /* email failure shouldn't fail the caller */
  }
}
