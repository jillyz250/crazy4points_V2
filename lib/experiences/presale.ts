/**
 * Presale vs marquee classification for experience_listings.
 *
 * Presales = card-member early-access to concerts/shows/games (Citi Entertainment,
 * Amex presales). High-volume, low-editorial-value — they're directory filler, not
 * marquee points-redeemable experiences with a transfer angle. Split them out so
 * they don't clutter the "new to review" count or the public directory.
 *
 * Classification is category-based (categories are messy/mixed-case in the data,
 * so match case-insensitively). Everything not a presale is treated as marquee
 * and IS worth reviewing.
 */
const PRESALE_CATEGORIES = new Set(['entertainment', 'music', 'sports', 'music & film'])

export function isPresaleListing(category: string | null | undefined): boolean {
  return PRESALE_CATEGORIES.has((category ?? '').trim().toLowerCase())
}
