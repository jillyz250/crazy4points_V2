/**
 * The structured shape Claude must return when extracting a credit card's
 * benefits from issuer-page markdown.
 *
 * Every value field includes a `source_quote` — the exact markdown snippet
 * Claude pulled the value from. Required for the verified-math rule + lets
 * the admin reviewer trace any number back to its source.
 *
 * NULL semantics: if Claude can't find a field on the page, it returns NULL
 * for that field (NOT the field omitted). Tracks "looked for it and it
 * wasn't there" vs. "didn't think to look."
 */

/** A single value Claude extracted, with the source quote backing it. */
export type Extracted<T> = {
  value: T | null
  source_quote: string | null
  confidence: 'high' | 'medium' | 'low'
}

/** Tiered welcome bonus segment beyond the main offer. */
export type TieredBonus = {
  spend_usd: number
  bonus_amount: number
  timeline_months: number | null
  note: string | null
}

export type WelcomeBonusExtraction = {
  main: {
    bonus_amount: number | null
    bonus_currency: string | null  // 'Ultimate Rewards' | 'Membership Rewards' | 'cash back' | etc.
    spend_required_usd: number | null
    spend_window_months: number | null
  }
  tiered: TieredBonus[]  // empty array if no tiered offer
  extras: string | null   // free text for non-numeric extras ("plus a free night cert", "transfer bonus during first year")
  source_quote: string | null
  confidence: 'high' | 'medium' | 'low'
}

export type EarnRateExtraction = {
  category: string           // 'travel_through_portal' | 'dining' | 'groceries' | 'gas' | 'streaming' | 'base' | etc.
  multiplier: number
  cap_amount_usd: number | null
  cap_period: 'monthly' | 'quarterly' | 'annual' | 'lifetime' | null
  rotating: boolean
  booking_channel: 'direct' | 'portal' | 'any'
  notes: string | null
  source_quote: string
}

/**
 * Benefit types — must match credit_card_benefits.benefit_type enum in migration 044.
 * Claude returns the enum value directly; if it sees a benefit that doesn't
 * cleanly map, it uses 'other' and notes the actual name in the `name` field.
 */
export type BenefitExtraction = {
  category: 'statement_credit' | 'travel_credit' | 'lounge_access' | 'insurance'
          | 'free_night' | 'status_conferred' | 'protection' | 'spend_unlock'
          | 'portal_redemption' | 'transfer_partner_unlock' | 'other'
  benefit_type: string  // one of the 50+ enum values from migration 044
  name: string          // human-readable (e.g., "$300 Annual Travel Credit")
  value_amount: number | null
  value_unit: 'USD' | 'nights' | 'pct' | 'points' | 'miles' | 'points_per_dollar' | null
  coverage_amount: number | null  // for insurance limits ($10K trip cancellation, etc.)
  frequency: 'per_trip' | 'annual' | 'anniversary' | 'monthly' | 'lifetime' | 'one_time' | 'quarterly' | null
  spend_threshold_usd: number | null
  description: string | null
  metadata: Record<string, unknown>  // type-specific fine print
  source_quote: string
  confidence: 'high' | 'medium' | 'low'
}

export type CardExtraction = {
  // Top-level card properties
  annual_fee_usd: Extracted<number>
  foreign_transaction_fee_pct: Extracted<number>
  credit_score_recommended: Extracted<'fair' | 'good' | 'excellent'>

  // Welcome bonus (single current offer)
  welcome_bonus: WelcomeBonusExtraction

  // Earn rates (variable length array)
  earn_rates: EarnRateExtraction[]

  // Structured benefits (variable length array)
  benefits: BenefitExtraction[]

  // Referral economics
  referral_bonus_amount: Extracted<number>
  referral_bonus_currency: Extracted<string>
  referral_cap_per_year: Extracted<number>

  // Authorized user economics
  authorized_user_fee_usd: Extracted<number>
  authorized_user_fee_structure: Extracted<string>
  authorized_user_bonus_points: Extracted<number>

  // Editorial intro (Claude writes 1-2 sentences summarizing the card)
  intro: Extracted<string>

  // Warnings (things Claude tried to extract but couldn't, or fields with low confidence)
  extraction_warnings: string[]
}
