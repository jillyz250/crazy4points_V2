/**
 * Content categories for the social calendar — the editorial THEME of a post, which
 * drives the color chips + the variety rotation (Jill wants to alternate types across
 * days: experience -> sweepstakes -> sweet spot -> program news ...). Distinct from
 * `source_type` (where the item came from). Jewel-tone palette, one per category.
 */
export type SocialCategory =
  | 'experience' | 'sweepstakes' | 'sweet_spot' | 'program_news' | 'deal' | 'guide' | 'recurring' | 'other'

export const SOCIAL_CATEGORIES: { key: SocialCategory; label: string; color: string }[] = [
  { key: 'sweet_spot', label: 'Sweet Spot', color: '#6B2D8F' },
  { key: 'program_news', label: 'Program / Airline News', color: '#2B6CB0' },
  { key: 'deal', label: 'Deal / Bonus', color: '#2E7D5B' },
  { key: 'sweepstakes', label: 'Sweepstakes', color: '#B8901F' },
  { key: 'experience', label: 'Experience', color: '#17868A' },
  { key: 'guide', label: 'Guide / Article', color: '#B03D77' },
  { key: 'recurring', label: 'Recurring', color: '#5A6B8C' },
  { key: 'other', label: 'Other', color: '#6E6486' },
]

export const CATEGORY_COLOR: Record<string, string> = Object.fromEntries(SOCIAL_CATEGORIES.map((c) => [c.key, c.color]))
export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(SOCIAL_CATEGORIES.map((c) => [c.key, c.label]))

/** Best-guess category from where an item originated (Jill can override on the card). */
export function inferCategory(sourceType: string): SocialCategory {
  switch (sourceType) {
    case 'recurring': return 'recurring'
    case 'sweepstakes': return 'sweepstakes'
    case 'experience': return 'experience'
    case 'article': return 'guide'
    case 'alert': return 'program_news'
    default: return 'other'
  }
}

const STOP = new Set(['the', 'a', 'an', 'to', 'in', 'on', 'for', 'with', 'and', 'of', 'at', 'your', 'you', 'is', 'now', 'from', 'by', 'this', 'that', 'get', 'earn', 'win', 'per', 'up', 'q1', 'q2', 'q3', 'q4', 'categories', 'category', 'bonus', 'points', 'point', 'miles', 'mile', 'sweepstakes', 'entry', 'night'])

/**
 * Normalized signature for dedup: lowercase, strip punctuation/digits/percent, drop
 * stopwords + quarter markers, keep the distinctive tokens sorted. Two items whose
 * signatures share >= 2 tokens are treated as the same idea (catches "Chase Freedom
 * 5% quarterly categories" vs "Chase Freedom Q4 categories").
 */
export function topicSignature(topic: string | null | undefined): string[] {
  return [...new Set(
    String(topic ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\b\d+%?\b/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  )].sort()
}

/**
 * Two topic signatures are the same idea when they share at least 2 distinctive
 * tokens AND those shared tokens are a solid fraction (>=60%) of the smaller
 * signature. The ratio guard stops common phrases ("first class", "sweet spot")
 * from falsely matching unrelated posts, while still collapsing true repeats like
 * "Chase Freedom quarterly categories" vs "Chase Freedom Q4 categories".
 */
export function signaturesOverlap(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false
  const set = new Set(a)
  let shared = 0
  for (const t of b) if (set.has(t)) shared++
  return shared >= 2 && shared / Math.min(a.length, b.length) >= 0.6
}
