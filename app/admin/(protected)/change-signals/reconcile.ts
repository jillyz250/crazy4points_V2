/**
 * Shared, pure helpers for the "Apply to page" flow on change signals.
 *
 * Kept in a plain module (NOT 'use server') so both the server panel and the
 * server actions can import the sync helpers and the STANDING-type gate.
 */

/**
 * signal_types that represent a PERMANENT program fact and therefore belong on
 * the program PAGE (as a quirk), not in a time-boxed alert.
 *
 * The announcement monitor's own classifier (utils/integrity/scanAnnouncements)
 * only ever emits: new_partner | ended_partner | ratio_change | devaluation |
 * (rarely) other, plus transfer_bonus from the bonus monitor. Of those, only
 * the four PERMANENT ones are page-worthy. `transfer_bonus` and `other` are
 * NEVER page edits (transfer bonuses are alerts — hard rule). The extra two
 * (partner_change / partner_conversion) are future-proofing for signal types
 * that don't exist in the data today but match the "standing change" contract.
 */
export const STANDING_SIGNAL_TYPES = new Set<string>([
  'new_partner',
  'ended_partner',
  'ratio_change',
  'devaluation',
  'partner_change',
  'partner_conversion',
])

export function isStandingSignal(signalType: string | null | undefined): boolean {
  return !!signalType && STANDING_SIGNAL_TYPES.has(signalType)
}

// Common words that carry no matching signal — dropped before the overlap test.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'will', 'now',
  'has', 'have', 'are', 'was', 'were', 'been', 'being', 'its', 'their', 'they',
  'points', 'miles', 'program', 'programs', 'transfer', 'transfers', 'partner',
  'partners', 'award', 'awards', 'ratio', 'change', 'changed', 'changes', 'new',
  'added', 'adds', 'removed', 'removes', 'ending', 'ends', 'ended', 'longer',
  'value', 'rewards', 'point', 'mile',
])

/**
 * Extract the distinctive tokens from a signal summary: alphabetic words of 4+
 * chars that aren't stopwords, plus any tokens containing a digit (ratios like
 * "3:2", years like "2026"). Deduped, lowercased. These are the nouns/numbers
 * that would appear on the page if the change were already documented.
 */
export function extractKeyTokens(summary: string): string[] {
  const raw = (summary ?? '').toLowerCase().match(/[a-z0-9][a-z0-9'.]*[a-z0-9]|[0-9]+/g) ?? []
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of raw) {
    const hasDigit = /[0-9]/.test(t)
    if (!hasDigit && (t.length < 4 || STOPWORDS.has(t))) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

/**
 * Fuzzy reconcile: does the program page already document this change?
 *
 * Compares the signal summary's distinctive tokens against the page's existing
 * prose (quirks + sweet_spots + intro). Returns true only when a strong
 * majority of the distinctive tokens already appear — deliberately biased
 * toward FALSE (show the Apply button) when uncertain, so a real change is
 * never silently suppressed. This is a convenience hint, not a gate.
 *
 * `ignoreTokens` (the program's OWN name + slug words) are dropped first: a
 * program's own name is GUARANTEED to be on its own page and carries no signal
 * about whether the change is documented, so leaving it in produced false
 * "already on page" hits (e.g. a Radisson->Finnair signal matched purely on
 * "finnair"/"plus"/"avios" while the actual new partner, Radisson, was absent).
 */
export function alreadyReflected(summary: string, pageText: string, ignoreTokens: string[] = []): boolean {
  const ignore = new Set(ignoreTokens.map((t) => t.toLowerCase()))
  const tokens = extractKeyTokens(summary).filter((t) => !ignore.has(t))
  // Too few distinctive tokens to judge confidently — don't claim it's covered.
  if (tokens.length < 2) return false
  const hay = (pageText ?? '').toLowerCase()
  if (!hay) return false
  let matched = 0
  for (const t of tokens) if (hay.includes(t)) matched++
  return matched / tokens.length >= 0.7
}

/**
 * Build the "ignore" token list for a program from its name + slug — the words
 * that will always be on the program's own page. Reuses extractKeyTokens so the
 * tokenization matches, plus the raw slug words (which may be < 4 chars).
 */
export function ownNameTokens(name: string | null | undefined, slug: string | null | undefined): string[] {
  const fromName = extractKeyTokens(name ?? '')
  const fromSlug = (slug ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return Array.from(new Set([...fromName, ...fromSlug]))
}
