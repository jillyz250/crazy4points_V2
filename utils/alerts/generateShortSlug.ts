import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generate a short, human-readable URL slug from an alert title.
 * Matches the SQL-side backfill algorithm in migration 245.
 *
 *   "Hawaiian Airlines Joins oneworld — Now Bookable with Avios..." →
 *   "hawaiian-airlines-joins-oneworld"
 *
 *   "Citi ThankYou → Leaders Club 25% Transfer Bonus — Ends May 16" →
 *   "citi-thankyou"  (everything after the arrow gets dropped, then
 *                     stop words removed)
 *
 * Returns null if the title has no usable content; caller should fall back.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'with', 'now', 'on', 'in', 'of',
  'is', 'to', 'for', 'from',
])

function generateBaseShortSlug(title: string): string | null {
  let base = title.toLowerCase()
  // Drop everything after the first separator (arrow / em-dash / -- )
  base = base.replace(/\s*(?:→|↔|—|--).*$/, '')
  // Strip non-alphanumerics
  base = base.replace(/[^a-z0-9\s]/g, ' ')
  // Collapse whitespace
  base = base.replace(/\s+/g, ' ').trim()
  if (!base) return null

  const words = base.split(' ').filter((w) => !STOP_WORDS.has(w))
  if (words.length === 0) return null

  // Keep up to 5 meaningful words, ≤40 chars, NEVER cut mid-word.
  // If 5-word join exceeds 40 chars, peel words off the end until it fits.
  let candidate = words.slice(0, 5).join('-')
  while (candidate.length > 40 && candidate.includes('-')) {
    candidate = candidate.slice(0, candidate.lastIndexOf('-'))
  }
  // Last-ditch: if a single word is still >40 chars, do a hard truncate
  // but only THEN — not at the end of a partial-word.
  if (candidate.length > 40) candidate = candidate.slice(0, 40)
  candidate = candidate.replace(/-+$/, '')
  return candidate || null
}

/**
 * Generate a UNIQUE short_slug. Checks the alerts table for collisions
 * against the base slug; appends -2, -3, etc. until free.
 */
export async function generateUniqueShortSlug(
  supabase: SupabaseClient,
  title: string,
  excludeAlertId?: string,
): Promise<string> {
  const base = generateBaseShortSlug(title) ?? `alert-${Date.now().toString(36)}`
  let candidate = base
  let counter = 2
  for (let i = 0; i < 100; i++) {
    const query = supabase
      .from('alerts')
      .select('id')
      .eq('short_slug', candidate)
    const { data } = excludeAlertId
      ? await query.neq('id', excludeAlertId).maybeSingle()
      : await query.maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${counter}`
    counter++
  }
  // Pathological fallback — collision storm, give a uuid-suffixed slug
  return `${base}-${Date.now().toString(36)}`
}
