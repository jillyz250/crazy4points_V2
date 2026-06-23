/**
 * good_to_know prose-review flag helpers.
 *
 * When a card's welcome-bonus DATA changes (Apply on /admin/card-bonus-signals,
 * a re-extract, or the Firecrawl monitor), the good_to_know PROSE often still
 * quotes the OLD number. These helpers let the write path flag the card the
 * moment the bonus changes, instead of waiting up to 7 days for the weekly
 * Sonnet audit. The flag is surfaced on /admin/data-integrity and
 * /admin/card-bonus-signals, and cleared when the editor next saves the prose.
 *
 * The detection is deterministic (no LLM): we KNOW the exact old amount/spend
 * being replaced, so we just check whether the prose still contains those
 * figures. Zero false positives from model judgement; a flag only prompts a
 * re-check (never auto-edits), so a rare incidental number match is harmless.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { auditGoodToKnow } from './auditGoodToKnow'

/** Number formats the prose might use for a figure, e.g. 70000 -> ["70,000","70000"]. */
function numberForms(n: number): string[] {
  return [n.toLocaleString('en-US'), String(n)]
}

/** Does `text` reference `n` as a standalone figure (comma or plain form)? */
function mentions(text: string, n: number | null | undefined): boolean {
  if (n == null || !Number.isFinite(n) || n <= 0) return false
  return numberForms(n).some((form) => new RegExp(`\\b${form.replace(/,/g, ',')}\\b`).test(text))
}

/**
 * Flag the card for a good_to_know re-check IF its prose still references the
 * old bonus amount or old spend that just changed. No-op when the prose is
 * empty or doesn't mention the stale figures. Never throws.
 */
export async function flagGoodToKnowReviewIfStale(
  supabase: SupabaseClient,
  cardId: string,
  change: { oldAmount?: number | null; newAmount?: number | null; oldSpend?: number | null; newSpend?: number | null },
): Promise<boolean> {
  try {
    const { data: card } = await supabase
      .from('credit_cards')
      .select('good_to_know')
      .eq('id', cardId)
      .single()
    const prose = (card?.good_to_know as string | null) ?? ''
    if (!prose.trim()) return false

    const amountStale = change.oldAmount != null && change.oldAmount !== change.newAmount && mentions(prose, change.oldAmount)
    const spendStale = change.oldSpend != null && change.oldSpend !== change.newSpend && mentions(prose, change.oldSpend)
    if (!amountStale && !spendStale) return false

    const parts: string[] = []
    if (amountStale) parts.push(`bonus ${change.oldAmount!.toLocaleString()} -> ${change.newAmount?.toLocaleString() ?? '?'}`)
    if (spendStale) parts.push(`spend $${change.oldSpend!.toLocaleString()} -> $${change.newSpend?.toLocaleString() ?? '?'}`)
    const reason = `Welcome bonus changed (${parts.join('; ')}); good_to_know prose still quotes the old figure.`

    await supabase
      .from('credit_cards')
      .update({ good_to_know_review_at: new Date().toISOString(), good_to_know_review_reason: reason })
      .eq('id', cardId)
    return true
  } catch {
    return false
  }
}

/**
 * Flag the card for a good_to_know re-check after a RE-EXTRACT (tiered offers,
 * or any full re-extraction). A re-extract can rebuild the welcome bonus and
 * other fields without an old/new figure to diff against, so here we run the
 * full Sonnet accuracy audit (the same guardrail used on manual prose saves):
 * if it finds the prose now conflicts with the freshly-extracted data, flag it.
 * No-op when the prose is empty, the audit is clean, or the API key is absent.
 * Never throws.
 */
export async function flagGoodToKnowReviewViaAudit(supabase: SupabaseClient, cardId: string): Promise<boolean> {
  try {
    const { data: card } = await supabase
      .from('credit_cards')
      .select('good_to_know')
      .eq('id', cardId)
      .single()
    const prose = (card?.good_to_know as string | null) ?? ''
    if (!prose.trim()) return false

    const issues = await auditGoodToKnow(supabase, cardId, prose)
    if (!issues.length) return false

    const top = issues.slice(0, 2).map((i) => i.claim).join('; ')
    const reason = `Re-extract changed card data; good_to_know audit flagged: ${top}${issues.length > 2 ? ` (+${issues.length - 2} more)` : ''}.`
    await supabase
      .from('credit_cards')
      .update({ good_to_know_review_at: new Date().toISOString(), good_to_know_review_reason: reason })
      .eq('id', cardId)
    return true
  } catch {
    return false
  }
}

/** Clear the prose-review flag (editor has re-checked / saved the prose). Never throws. */
export async function clearGoodToKnowReview(supabase: SupabaseClient, cardId: string): Promise<void> {
  try {
    await supabase
      .from('credit_cards')
      .update({ good_to_know_review_at: null, good_to_know_review_reason: null })
      .eq('id', cardId)
  } catch {
    /* non-fatal */
  }
}
