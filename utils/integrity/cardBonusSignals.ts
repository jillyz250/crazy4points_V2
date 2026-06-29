import type { SupabaseClient } from '@supabase/supabase-js'
import type { CardBonusSignal } from './scanCardBonuses'

/**
 * Shared persistence for welcome-bonus signals, written by the daily
 * scanCardBonuses cron. Welcome-bonus changes surface in the Daily Data Digest
 * (app/api/cron/daily-digest). The content_hash formula is byte-identical to
 * scanCardBonuses.hash() so re-detections upsert to the same row.
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
 * The "Up to X" headline total for a welcome bonus = bonus_amount (first tier)
 * plus any additional tiers, de-duping one echo of the main amount. Mirrors the
 * card-page formatter + gatherElevatedBonuses. Tiered cards store bonus_amount =
 * first tier, but the page headline (and the extractor) read this total — so the
 * monitor must compare a detected value against BOTH to avoid false flags.
 */
export function welcomeBonusDisplayTotal(
  bonusAmount: number,
  tiers: Array<{ bonus_amount?: unknown; spend_usd?: unknown }> | null | undefined,
  baseSpend?: number | null,
): number {
  let extras = 0
  let echoSeen = false
  for (const t of Array.isArray(tiers) ? tiers : []) {
    const amt = typeof t?.bonus_amount === 'number' ? t.bonus_amount : NaN
    if (!Number.isFinite(amt)) continue
    // The first tier usually ECHOES the base offer (same amount + same spend);
    // dedup it once. Matching amount ALONE wrongly swallowed a legitimate tier
    // coincidentally equal to the base, so when we know the base spend AND the
    // tier records its own spend, require the spend to match too.
    const spend = typeof t?.spend_usd === 'number' ? t.spend_usd : null
    const isEcho = amt === bonusAmount && (baseSpend == null || spend == null || spend === baseSpend)
    if (!echoSeen && isEcho) {
      echoSeen = true
      continue
    }
    extras += amt
  }
  return bonusAmount + extras
}

/**
 * Cash/dollar-denominated bonuses (Freedom Flex stores $200, Ink Unlimited stores
 * $1,000 cash back) keep their amount in USD, not points. Detect those currencies
 * so the comparison can guard against the points-vs-dollars unit mismatch below.
 */
export function isCashCurrency(currency: string | null | undefined): boolean {
  return !!currency && /usd|cash/i.test(currency)
}

/**
 * Is a detected welcome-bonus amount a REAL change from what we store? Filters two
 * non-changes that otherwise generate false signals:
 *
 *  1. Tiered echo — detected matches the "Up to X" headline total instead of the
 *     stored first tier (handled via `storedTotal`).
 *  2. Points-as-cents — for CASH-denominated cards (we store $200) the issuer page
 *     headlines the SAME bonus in points (20,000 = $200 at 1 point = 1¢). The
 *     extractor reads 20,000; a naive compare flags a change that isn't one. This
 *     was the recurring Freedom Flex false positive. detected === stored×100 (or
 *     the reverse) is the same offer in a different unit, not a devaluation.
 */
export function welcomeBonusAmountChanged(
  storedAmount: number | null,
  storedTotal: number | null,
  detectedAmount: number | null,
  currency: string | null | undefined,
): boolean {
  if (storedAmount == null || detectedAmount == null) return false
  if (detectedAmount === storedAmount || detectedAmount === storedTotal) return false
  if (isCashCurrency(currency) && (detectedAmount === storedAmount * 100 || storedAmount === detectedAmount * 100)) {
    return false
  }
  return true
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
