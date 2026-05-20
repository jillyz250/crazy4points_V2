/**
 * Normalize a headline for Layer 3 fuzzy dedup (pg_trgm similarity).
 *
 * Mirrors the SQL backfill expression in migration 310:
 *   lower(regexp_replace(headline, '[^a-z0-9 ]+', ' ', 'gi'))
 *
 * Lowercase, strip non-alphanumeric to space, collapse runs of whitespace.
 * Stable across "20%" vs "20 percent" only loosely — that case is handled by
 * trigram similarity (>= 0.7) at query time, not by perfect normalization.
 */
export function normalizeHeadline(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
