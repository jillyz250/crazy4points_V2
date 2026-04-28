/**
 * Builds an authoritative source-text block from credit_cards rows. Used by
 * the writer (so card-comparison drafts cite verified facts) and the
 * fact-checker (so card-related claims ground against /cards/[slug] data
 * instead of going to thepointsguy or chase.com).
 *
 * Mirrors programSourceText.ts but for the credit_cards table.
 */

interface CardSubset {
  slug: string
  name: string | null
  issuer_id?: string | null
  annual_fee_usd: number | null
  card_type: string | null
  card_tier: string | null
  chase_5_24_subject: boolean | null
  foreign_transaction_fee_pct: number | null
  intro: string | null
  good_to_know: string | null
  intended_user: string | null
  notes: string | null
}

export const CARD_FIELDS_FOR_SOURCE =
  'slug, name, issuer_id, annual_fee_usd, card_type, card_tier, chase_5_24_subject, foreign_transaction_fee_pct, intro, good_to_know, intended_user, notes'

export function cardToSourceText(card: CardSubset): string {
  const out: string[] = []
  out.push(`# ${card.name ?? card.slug} (${card.slug})`)
  if (card.card_type) out.push(`Card type: ${card.card_type}${card.card_tier ? ` / ${card.card_tier}` : ''}`)
  if (typeof card.annual_fee_usd === 'number') {
    out.push(`Annual fee: $${card.annual_fee_usd}`)
  }
  if (typeof card.chase_5_24_subject === 'boolean') {
    out.push(`Subject to Chase 5/24: ${card.chase_5_24_subject ? 'YES' : 'NO'}`)
  }
  if (typeof card.foreign_transaction_fee_pct === 'number') {
    out.push(
      `Foreign transaction fee: ${
        card.foreign_transaction_fee_pct === 0 ? 'none (0%)' : `${card.foreign_transaction_fee_pct}%`
      }`
    )
  }
  if (card.intended_user) out.push(`\nWho it's for:\n${card.intended_user}`)
  if (card.intro) out.push(`\nIntro / overview:\n${card.intro}`)
  if (card.good_to_know) out.push(`\nGood to know (fine print, gotchas, anniversary perks, etc.):\n${card.good_to_know}`)
  if (card.notes) out.push(`\nEditorial notes:\n${card.notes}`)
  return out.join('\n')
}

export function cardsToSourceText(cards: CardSubset[]): string {
  if (cards.length === 0) return ''
  return cards
    .map(cardToSourceText)
    .join('\n\n═══════════════════════════════════════════\n\n')
}

export type CardSource = CardSubset
