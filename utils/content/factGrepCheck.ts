/**
 * factGrepCheck — post-generation anti-fabrication check.
 *
 * After Sonnet writes a variant body, we scan the body for "specific" claims
 * (dollar amounts, percentages, dates, years, card/program names) and verify
 * each one appears in the topic's fact_ledger (claim + source_quote
 * concatenated as a haystack). If a specific claim doesn't trace back to the
 * ledger, we surface it for editor review — the variant gets saved as
 * `needs_review` instead of `draft`.
 *
 * This is the second line of defence after the constrained Sonnet prompt.
 * The prompt tells the model not to introduce facts from training data;
 * factGrepCheck catches it when the model does anyway.
 *
 * See plans/content-system-rehaul.md → Anti-fabrication safeguards.
 */

import type { FactLedgerEntry } from '@/utils/supabase/queries'

export type FactGrepPatternType =
  | 'dollar'
  | 'percent'
  | 'date'
  | 'year'
  | 'card_name'
  | 'program_name'
  | 'merchant'

export type FactGrepUnmatched = {
  claim_snippet: string
  pattern_type: FactGrepPatternType
}

export type FactGrepResult = {
  ok: boolean
  unmatched: FactGrepUnmatched[]
}

// ─── Regex extractors ────────────────────────────────────────────────────
// Money: $50, $1,000, $1.5M, $250K, $1.50
const DOLLAR_RE = /\$[\d,]+(?:\.\d+)?[KMk]?\b/g
// Percent: 10%, 1.5%
const PERCENT_RE = /\b\d+(?:\.\d+)?%/g
// Dates with month names: "May 1, 2026", "Jan 31 2026", "December 1, 2025"
const DATE_RE =
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4}\b/gi
// Bare 4-digit years 1900-2099
const YEAR_RE = /\b(?:19|20)\d{2}\b/g

/**
 * Normalize a string for fuzzy "contains" matching.
 * - Lowercases
 * - Collapses whitespace
 * - Strips commas inside numbers (so "1,000" == "1000")
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/(\d),(\d)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildHaystack(
  factLedger: FactLedgerEntry[],
  extraStrings: string[] = [],
): string {
  const parts: string[] = []
  for (const entry of factLedger) {
    if (entry.claim) parts.push(entry.claim)
    if (entry.source_quote) parts.push(entry.source_quote)
  }
  parts.push(...extraStrings)
  return normalize(parts.join('\n'))
}

function uniq(items: string[]): string[] {
  return Array.from(new Set(items))
}

function check(
  matches: string[],
  haystack: string,
  patternType: FactGrepPatternType,
): FactGrepUnmatched[] {
  const out: FactGrepUnmatched[] = []
  for (const m of uniq(matches)) {
    const needle = normalize(m)
    if (!needle) continue
    if (!haystack.includes(needle)) {
      out.push({ claim_snippet: m, pattern_type: patternType })
    }
  }
  return out
}

export function factGrepCheck(
  variantBody: string,
  factLedger: FactLedgerEntry[],
  knownCardNames: string[] = [],
  knownProgramNames: string[] = [],
): FactGrepResult {
  if (!variantBody) return { ok: true, unmatched: [] }

  // The haystack ALSO includes known card + program names (passed in by the
  // server action from topic.cards / topic.programs). These are legit by
  // definition — they were attached to the topic on purpose.
  const haystack = buildHaystack(factLedger, [
    ...knownCardNames,
    ...knownProgramNames,
  ])

  const unmatched: FactGrepUnmatched[] = []

  // Dollars
  unmatched.push(...check(variantBody.match(DOLLAR_RE) ?? [], haystack, 'dollar'))

  // Percents
  unmatched.push(
    ...check(variantBody.match(PERCENT_RE) ?? [], haystack, 'percent'),
  )

  // Dates (full month-day-year). Skip bare years for now — too many false
  // positives ("the 2026 sweet spot" doesn't need to be in the ledger).
  unmatched.push(...check(variantBody.match(DATE_RE) ?? [], haystack, 'date'))

  // Card name check: any card name in `knownCardNames` is fine. We surface
  // suspect card-shaped strings only if we have a list to compare against.
  // For now we only flag known names that DO appear in body but don't appear
  // in ledger AND weren't on the topic. By construction this can't happen
  // (haystack includes both lists), but the structure is here for PR 4 to
  // extend with a "card-like noun phrase" extractor if we want it.

  return { ok: unmatched.length === 0, unmatched }
}
