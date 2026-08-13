/**
 * Tag whitelist / canonicalization for roadmap tags.
 *
 * Copilot feedback 2026-08-13: free-form tags will bloat the coverage counter
 * unless we collapse variants ("amex", "amex mr", "membership rewards" are all
 * the same program). This normalizes any raw tag to a stable canonical form:
 *   - program-name variants snap to one canonical program tag (a "soft" whitelist)
 *   - everything else (themes like "beginner", "europe", "transfer-bonus") is
 *     slugified and passes through, so the vocabulary stays flexible.
 *
 * Deterministic and DB-free on purpose — it runs at write time (tag add, AI
 * suggestion) and at read time (coverage view) so old and new tags collapse
 * to the same key.
 */

/** Common program-name variants → one canonical tag. Keys are matched after
 *  lowercasing + collapsing whitespace; longest key wins on partial contains. */
const PROGRAM_SYNONYMS: Record<string, string> = {
  // Chase
  'chase ultimate rewards': 'chase',
  'ultimate rewards': 'chase',
  'chase ur': 'chase',
  'chase': 'chase',
  'ur': 'chase',
  // Amex
  'amex membership rewards': 'amex',
  'american express': 'amex',
  'membership rewards': 'amex',
  'amex mr': 'amex',
  'amex': 'amex',
  'mr': 'amex',
  // Capital One
  'capital one miles': 'capital-one',
  'capital one': 'capital-one',
  'cap one': 'capital-one',
  'capone': 'capital-one',
  'c1': 'capital-one',
  // Citi
  'citi thankyou': 'citi',
  'citi thank you': 'citi',
  'thankyou points': 'citi',
  'thankyou': 'citi',
  'citi': 'citi',
  // Bilt
  'bilt rewards': 'bilt',
  'bilt points': 'bilt',
  'bilt': 'bilt',
  // United
  'united mileageplus': 'united',
  'mileageplus': 'united',
  'united': 'united',
  // Delta
  'delta skymiles': 'delta',
  'skymiles': 'delta',
  'delta': 'delta',
  // American
  'american aadvantage': 'american',
  'aadvantage': 'american',
  'american airlines': 'american',
  'american': 'american',
  'aa': 'american',
  // Alaska / Atmos
  'alaska mileage plan': 'alaska',
  'mileage plan': 'alaska',
  'atmos rewards': 'alaska',
  'atmos': 'alaska',
  'alaska': 'alaska',
  // Southwest
  'southwest rapid rewards': 'southwest',
  'rapid rewards': 'southwest',
  'southwest': 'southwest',
  // Aeroplan
  'air canada aeroplan': 'aeroplan',
  'air canada': 'aeroplan',
  'aeroplan': 'aeroplan',
  // Flying Blue
  'air france klm': 'flying-blue',
  'flying blue': 'flying-blue',
  'flyingblue': 'flying-blue',
  // Avios
  'british airways avios': 'avios',
  'british airways': 'avios',
  'avios': 'avios',
  'ba': 'avios',
  // Hyatt
  'world of hyatt': 'hyatt',
  'hyatt': 'hyatt',
  // Marriott
  'marriott bonvoy': 'marriott',
  'bonvoy': 'marriott',
  'marriott': 'marriott',
  // Hilton
  'hilton honors': 'hilton',
  'hilton': 'hilton',
  // IHG
  'ihg one rewards': 'ihg',
  'ihg': 'ihg',
  // Wyndham
  'wyndham rewards': 'wyndham',
  'wyndham': 'wyndham',
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Canonicalize a single raw tag. Program-name variants collapse to one tag;
 * anything else is slugified and returned as-is. Empty in → empty out.
 */
export function normalizeTag(raw: string): string {
  const cleaned = raw.toLowerCase().trim().replace(/\s+/g, ' ')
  if (!cleaned) return ''
  // Exact synonym hit first.
  if (PROGRAM_SYNONYMS[cleaned]) return PROGRAM_SYNONYMS[cleaned]
  // Also match a kebab form against the synonym values (e.g. "flying-blue").
  const kebab = slugify(cleaned)
  const canonicalValues = new Set(Object.values(PROGRAM_SYNONYMS))
  if (canonicalValues.has(kebab)) return kebab
  // Longest-key partial contains, so "how to use chase ur" → "chase".
  const keys = Object.keys(PROGRAM_SYNONYMS).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    // Word-boundary-ish contains to avoid "aa" matching inside "aaa".
    const re = new RegExp(`(^|[^a-z])${k.replace(/[^a-z0-9 ]/g, '')}([^a-z]|$)`)
    if (re.test(cleaned)) return PROGRAM_SYNONYMS[k]
  }
  return kebab.slice(0, 40)
}

/** Normalize a list of tags: canonicalize, drop empties, dedupe, cap. */
export function normalizeTags(raw: string[], cap = 6): string[] {
  const out: string[] = []
  for (const t of raw) {
    const n = normalizeTag(t)
    if (n && !out.includes(n)) out.push(n)
    if (out.length >= cap) break
  }
  return out
}
