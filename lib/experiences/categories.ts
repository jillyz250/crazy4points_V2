/**
 * Category buckets for experiences — shared by the /experiences finder and the
 * homepage block so a "Music" tile reads the same everywhere. Collapses the
 * messy source categories (music / music & film / entertainment / sports /
 * culinary / culture / travel...) into a few labeled buckets, each with its own
 * muted jewel-tone accent that lives with the Royal Glow palette.
 */
export type CategoryBucket = { key: string; label: string; color: string }

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export function categoryBucket(category: string | null | undefined): CategoryBucket | null {
  const c = (category ?? '').toLowerCase()
  if (!c) return null
  if (c.includes('sport')) return { key: 'sports', label: 'Sports', color: '#2E7D5B' } // emerald
  if (c.includes('music') || c.includes('concert')) return { key: 'music', label: 'Music', color: '#B03D77' } // mulberry
  if (c.includes('culinar') || c.includes('dining') || c.includes('food'))
    return { key: 'dining', label: 'Culinary', color: '#B8901F' } // bronze
  if (c.includes('theat') || c.includes('art') || c.includes('cultur'))
    return { key: 'culture', label: 'Culture', color: '#3F5BA8' } // indigo
  if (c.includes('travel') || c.includes('trip') || c.includes('vacation') || c.includes('cruise') || c.includes('getaway') || c.includes('retreat') || c.includes('stay'))
    return { key: 'travel', label: 'Travel', color: '#17868A' } // teal
  if (c.includes('entertain') || c.includes('film')) return { key: 'entertainment', label: 'Entertainment', color: '#6B2D8F' } // purple
  return { key: `other:${c}`, label: cap(category as string), color: '#6E6486' } // muted fallback
}
