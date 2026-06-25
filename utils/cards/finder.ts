import type { FinderCard } from '@/utils/supabase/queries'

// Pure filter/sort helpers for the Card Finder/Explorer. Kept framework-free so
// the same logic can move server-side if the dataset ever outgrows client-side
// filtering (Explorer spec §2.1 escape hatch). No React, no DOM.

export type SortKey = 'relevance' | 'fee_asc' | 'fee_desc' | 'bonus' | 'earn'

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'relevance', label: 'Most relevant' },
  { key: 'fee_asc', label: 'Annual fee: low to high' },
  { key: 'fee_desc', label: 'Annual fee: high to low' },
  { key: 'bonus', label: 'Biggest welcome bonus' },
  { key: 'earn', label: 'Best rewards rate' },
]

// Annual-fee bands (locked, Explorer spec §7.1). Every card falls in exactly one.
export interface FeeBand { key: string; label: string; min: number; max: number }
export const FEE_BANDS: FeeBand[] = [
  { key: 'f0', label: '$0', min: 0, max: 0 },
  { key: 'f95', label: '$1–95', min: 1, max: 95 },
  { key: 'f250', label: '$96–250', min: 96, max: 250 },
  { key: 'f550', label: '$251–550', min: 251, max: 550 },
  { key: 'f551', label: '$551+', min: 551, max: Infinity },
]

/** A card matches if its fee falls in ANY selected band (OR within the fee axis).
 *  No bands selected = no fee constraint. Unknown fee never matches a band. */
export function cardInFeeBands(fee: number | null, bandKeys: string[]): boolean {
  if (bandKeys.length === 0) return true
  if (fee == null) return false
  return FEE_BANDS.some((b) => bandKeys.includes(b.key) && fee >= b.min && fee <= b.max)
}

// Fully-authored cards rank above any not-yet-authored ones; then cheaper first.
// Used as the relevance order and as the tiebreaker under every explicit sort.
function byRelevance(a: FinderCard, b: FinderCard): number {
  if (a.authored !== b.authored) return a.authored ? -1 : 1
  return (a.annualFee ?? Infinity) - (b.annualFee ?? Infinity)
}

/** Returns a new, sorted array — does not mutate the input. */
export function sortCards(cards: FinderCard[], sort: SortKey): FinderCard[] {
  const arr = [...cards]
  switch (sort) {
    case 'fee_asc':
      return arr.sort((a, b) => ((a.annualFee ?? Infinity) - (b.annualFee ?? Infinity)) || byRelevance(a, b))
    case 'fee_desc':
      return arr.sort((a, b) => ((b.annualFee ?? -Infinity) - (a.annualFee ?? -Infinity)) || byRelevance(a, b))
    case 'bonus':
      return arr.sort((a, b) => ((b.sub?.estimated_value_usd ?? -1) - (a.sub?.estimated_value_usd ?? -1)) || byRelevance(a, b))
    case 'earn':
      return arr.sort((a, b) => ((b.topEarn[0]?.multiplier ?? 0) - (a.topEarn[0]?.multiplier ?? 0)) || byRelevance(a, b))
    default:
      return arr.sort(byRelevance)
  }
}
