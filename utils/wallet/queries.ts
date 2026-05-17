/**
 * Wallet queries — power the /wallet feature.
 *
 * Returns all cards that have at least one extracted benefit (so the picker
 * never shows empty cards) plus their full benefit lists, pre-shaped for the
 * client-side checklist renderer.
 *
 * The wallet is a per-user mental model layered on top of public card data:
 *   - Server returns the catalog (cards + their benefits)
 *   - Client (browser localStorage) tracks which cards the user owns + which
 *     credits they've marked used in each period
 *
 * No DB writes from this feature — everything user-specific lives in the
 * browser. Means no auth needed to ship v0.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BenefitCategory,
  BenefitFrequency,
  BenefitValueUnit,
  CardType,
} from '@/utils/supabase/queries'

/** Subset of fields we surface in the wallet picker — keeps payload small. */
export interface WalletCard {
  id: string
  slug: string
  name: string
  card_type: CardType
  annual_fee_usd: number | null
  issuer_id: string
  issuer_slug: string
  issuer_name: string
}

/** Subset of benefit fields the checklist needs. */
export interface WalletBenefit {
  id: string
  card_id: string
  card_slug: string
  card_name: string
  issuer_name: string
  category: BenefitCategory
  benefit_type: string
  name: string
  value_amount: number | null
  value_unit: BenefitValueUnit | null
  coverage_amount: number | null
  frequency: BenefitFrequency | null
  description: string | null
}

export interface WalletBundle {
  /** Cards grouped by issuer for the picker. */
  cards: WalletCard[]
  /** Benefits across ALL extractable cards, keyed for client lookup. */
  benefits: WalletBenefit[]
}

// Which benefit categories are "use it or lose it" credits worth tracking
// in a monthly checklist. Insurance/protection are passive coverage, lounge
// access is passive, status is passive — none belong in a "use this credit"
// list, so filter them out at query time to keep the client payload lean.
const CHECKLIST_CATEGORIES: BenefitCategory[] = [
  'statement_credit',
  'travel_credit',
  'free_night',
]

// Which frequencies make sense for a periodic checklist. per_trip = insurance
// (skip), lifetime / one_time = either pure features or already-redeemed
// welcome perks (skip). anniversary requires per-user data (skip in v0).
const CHECKLIST_FREQUENCIES: BenefitFrequency[] = ['monthly', 'quarterly', 'annual']

export async function getWalletBundle(supabase: SupabaseClient): Promise<WalletBundle> {
  // Find every active card that has at least one checklist-eligible benefit.
  // Done in two passes so we can drop cards with zero qualifying benefits
  // (Freedom Rise has DashPass; cards with only insurance won't show up).
  const { data: benefitRows, error: benefitsErr } = await supabase
    .from('credit_card_benefits')
    .select('id, card_id, category, benefit_type, name, value_amount, value_unit, coverage_amount, frequency, description')
    .in('category', CHECKLIST_CATEGORIES)
    .in('frequency', CHECKLIST_FREQUENCIES)
    .order('sort_order', { ascending: true })

  if (benefitsErr) throw benefitsErr
  const rows = benefitRows ?? []

  const cardIdsWithBenefits = Array.from(new Set(rows.map((b) => b.card_id as string)))
  if (cardIdsWithBenefits.length === 0) {
    return { cards: [], benefits: [] }
  }

  // Fetch the cards + their issuers in one round trip.
  const { data: cardRows, error: cardsErr } = await supabase
    .from('credit_cards')
    .select('id, slug, name, card_type, annual_fee_usd, issuer_id, is_active')
    .in('id', cardIdsWithBenefits)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (cardsErr) throw cardsErr
  const activeCards = (cardRows ?? []) as Array<{
    id: string
    slug: string
    name: string
    card_type: CardType
    annual_fee_usd: number | null
    issuer_id: string
    is_active: boolean
  }>

  const issuerIds = Array.from(new Set(activeCards.map((c) => c.issuer_id)))
  const { data: issuerRows } = await supabase
    .from('issuers')
    .select('id, slug, name')
    .in('id', issuerIds)
  const issuerById = new Map(
    (issuerRows ?? []).map((i) => [i.id as string, { slug: i.slug as string, name: i.name as string }]),
  )

  const cardById = new Map(activeCards.map((c) => [c.id, c]))

  const cards: WalletCard[] = activeCards.map((c) => {
    const issuer = issuerById.get(c.issuer_id)
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      card_type: c.card_type,
      annual_fee_usd: c.annual_fee_usd,
      issuer_id: c.issuer_id,
      issuer_slug: issuer?.slug ?? '',
      issuer_name: issuer?.name ?? 'Unknown',
    }
  })

  const benefits: WalletBenefit[] = rows
    .filter((b) => cardById.has(b.card_id as string))
    .map((b) => {
      const card = cardById.get(b.card_id as string)!
      const issuer = issuerById.get(card.issuer_id)
      return {
        id: b.id as string,
        card_id: b.card_id as string,
        card_slug: card.slug,
        card_name: card.name,
        issuer_name: issuer?.name ?? 'Unknown',
        category: b.category as BenefitCategory,
        benefit_type: b.benefit_type as string,
        name: b.name as string,
        value_amount: b.value_amount as number | null,
        value_unit: b.value_unit as BenefitValueUnit | null,
        coverage_amount: b.coverage_amount as number | null,
        frequency: b.frequency as BenefitFrequency | null,
        description: b.description as string | null,
      }
    })

  return { cards, benefits }
}
