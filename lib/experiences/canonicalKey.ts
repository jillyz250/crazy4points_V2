/**
 * canonicalKey — group near-duplicate experience listings into ONE experience
 * (Jill, 2026-09-05). The scrapers ingest each ticket TIER / quantity / package
 * of the same event as its own listing (e.g. Shaboozey at Place Bell on Sept 24
 * shows up 3x: General 40k, VIP Meet & Greet 60k, VIP + Stay 75k), which floods
 * the review queue and the public directory with duplicates. `canonical_experience_key`
 * is the intended grouping column but was never populated; this derives it.
 *
 * The key = program + event date + a normalized title STEM with the tier /
 * package / quantity / seating noise stripped out, so all variants of the same
 * event collapse to one key while genuinely different events (other venue, other
 * date) stay separate. Heuristic by design — it drives grouping/display, never a
 * destructive merge, so an occasional imperfect grouping is harmless.
 */

// Phrases that distinguish a TIER/package/quantity of the same event, not a
// different event — stripped from the stem so tiers collapse together.
const NOISE_PATTERNS: RegExp[] = [
  /\bvip\b/gi,
  /\bmeet\s*(?:and|&|\+)?\s*greet\b/gi,
  /\bexperience(?:s)?\b/gi,
  /\bpackage\b/gi,
  /\bsuite(?:s)?\b/gi,
  /\bclub\s*level\b/gi,
  /\bclub\b/gi,
  /\bpremium\b/gi,
  /\bhospitality\b/gi,
  /\btunnel\b/gi,
  /\bsideline\b/gi,
  /\bfield\s*level\b/gi,
  /\bga\b/gi,
  /\bgeneral\s*admission\b/gi,
  /\bpit\b/gi,
  /\b(?:plus|with|incl\.?|including)\s+(?:a\s+)?stay\b/gi,
  /\+\s*stay\b/gi,
  /\bstay\s*included\b/gi,
  /\b\d+\s*[-\s]?(?:pack|tickets?|passes?|seats?|guests?|people|access)\b/gi,
  /\baccess\s*for\s*\d+\b/gi,
  /\bfor\s*\d+\b/gi,
  /\(\s*\d+\s*(?:tickets?|passes?|seats?|guests?)?\s*\)/gi,
  /\bstand\s*\d+\b/gi,
  /\brow\s*\w+\b/gi,
  /\bsection\s*\w+\b/gi,
  /\b\d+\/\d+\b/g, // "1/2", "2/2"
]

// Leading verbs the scrapers prepend ("See X", "Watch X", "Enjoy X").
const LEAD_VERBS = /^(?:see|watch|enjoy|experience|attend|join)\s+/i

function normalizeStem(title: string): string {
  let s = ` ${title.toLowerCase()} `
  for (const re of NOISE_PATTERNS) s = s.replace(re, ' ')
  s = s.replace(LEAD_VERBS, ' ')
  s = s
    .replace(/[^a-z0-9]+/g, ' ') // drop punctuation
    .replace(/\b\d+\b/g, ' ') // drop stray numbers (ticket counts, prices)
    .replace(/\s+/g, ' ')
    .trim()
  return s
}

/** Stable grouping key for an experience listing. */
export function canonicalKey(input: {
  program_slug?: string | null
  title?: string | null
  event_date?: string | null
}): string {
  const program = (input.program_slug ?? 'unknown').toLowerCase()
  const date = input.event_date ? String(input.event_date).slice(0, 10) : 'nodate'
  const stem = normalizeStem(input.title ?? '')
  return `${program}|${date}|${stem}`
}
