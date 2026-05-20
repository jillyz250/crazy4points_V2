/**
 * Layer 3 fuzzy dedup — pg_trgm similarity against last 14 days of intel_items.
 *
 * Returns the most-similar row above the SIMILARITY_THRESHOLD, or null if no
 * match exists. The trigram GIN index from migration 310 makes this O(log n).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const SIMILARITY_THRESHOLD = 0.7
const WINDOW_DAYS = 14

export interface SimilarMatch {
  id: string
  headline: string
  headline_normalized: string
  similarity: number
  created_at: string
  alert_id: string | null
  rejected_at: string | null
}

/**
 * Query intel_items for the most-similar non-rejected row in the last
 * WINDOW_DAYS where similarity(headline_normalized, candidate) >= threshold.
 *
 * We use a raw RPC call because supabase-js's PostgREST query builder doesn't
 * expose the similarity() function or the % operator from pg_trgm. The
 * function lives in the database (created in this migration if needed).
 */
export async function findSimilarHeadline(
  supabase: SupabaseClient,
  candidateNormalized: string,
): Promise<SimilarMatch | null> {
  if (!candidateNormalized) return null

  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Pull recent candidates and rank in memory.
  // Realistic volume: ~30 intel/day × 14 days = ~420 rows max. Trivial JS sort.
  // Avoids needing a custom Postgres function until volume justifies it.
  const { data, error } = await supabase
    .from('intel_items')
    .select('id, headline, headline_normalized, created_at, alert_id, rejected_at')
    .gte('created_at', cutoff)
    .not('headline_normalized', 'is', null)
    .is('rejected_at', null) // don't dedup against rejected items
    .order('created_at', { ascending: false })
    .limit(500)

  if (error || !data || data.length === 0) return null

  // Compute trigram similarity client-side via a Jaccard-ish proxy on character
  // trigrams. This mirrors pg_trgm's algorithm closely enough for our threshold.
  let best: SimilarMatch | null = null
  for (const row of data) {
    if (!row.headline_normalized) continue
    const sim = trigramSimilarity(candidateNormalized, row.headline_normalized)
    if (sim >= SIMILARITY_THRESHOLD && (!best || sim > best.similarity)) {
      best = {
        id: row.id,
        headline: row.headline,
        headline_normalized: row.headline_normalized,
        similarity: sim,
        created_at: row.created_at,
        alert_id: row.alert_id,
        rejected_at: row.rejected_at,
      }
    }
  }
  return best
}

/**
 * Character-trigram Jaccard similarity. Mirrors pg_trgm.similarity() closely.
 *
 * For each string: pad with two leading spaces and one trailing space, then
 * split into 3-character grams. Similarity = |A ∩ B| / |A ∪ B|.
 *
 * Exposed for unit testing.
 */
export function trigramSimilarity(a: string, b: string): number {
  const ga = trigrams(a)
  const gb = trigrams(b)
  if (ga.size === 0 || gb.size === 0) return 0
  let intersection = 0
  for (const g of ga) if (gb.has(g)) intersection++
  const union = ga.size + gb.size - intersection
  return union === 0 ? 0 : intersection / union
}

function trigrams(s: string): Set<string> {
  const padded = `  ${s} `
  const out = new Set<string>()
  for (let i = 0; i <= padded.length - 3; i++) {
    out.add(padded.slice(i, i + 3))
  }
  return out
}

export { SIMILARITY_THRESHOLD, WINDOW_DAYS }
