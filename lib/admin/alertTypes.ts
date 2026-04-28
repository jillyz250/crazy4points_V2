import type { AlertType, AlertActionType } from '@/utils/supabase/queries'

export const ALERT_TYPES: readonly { value: AlertType; label: string }[] = [
  // Earning & Bonuses
  { value: 'signup_bonus', label: 'Sign-Up Bonus' },
  { value: 'transfer_bonus', label: 'Transfer Bonus' },
  { value: 'referral_bonus', label: 'Referral Bonus' },
  { value: 'milestone_bonus', label: 'Milestone Bonus' },
  { value: 'shopping_portal_bonus', label: 'Shopping Portal Bonus' },
  { value: 'dining_bonus', label: 'Dining Bonus' },
  { value: 'point_purchase', label: 'Buy Points / Miles' },
  // Redemptions
  { value: 'award_availability', label: 'Award Availability' },
  { value: 'award_sale', label: 'Award Sale' },
  { value: 'sweet_spot', label: 'Sweet Spot' },
  { value: 'companion_pass', label: 'Companion Pass' },
  // Card Offers
  { value: 'limited_time_offer', label: 'Limited Time Offer' },
  { value: 'retention_offer', label: 'Retention Offer' },
  { value: 'card_credit', label: 'Card Credit / Perk' },
  { value: 'card_refresh', label: 'Card Refresh' },
  // Status & Promos
  { value: 'status_promo', label: 'Status Promo' },
  // Warnings
  { value: 'glitch', label: 'Glitch' },
  { value: 'devaluation', label: 'Devaluation' },
  { value: 'fee_change', label: 'Fee Change' },
  // Program Changes
  { value: 'program_change', label: 'Program Change' },
  { value: 'partner_change', label: 'Partner Change' },
  { value: 'category_change', label: 'Category Change' },
  { value: 'earn_rate_change', label: 'Earn Rate Change' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'policy_change', label: 'Policy Change' },
  // News
  { value: 'industry_news', label: 'Industry News' },
] as const

export const ACTION_TYPES: readonly { value: AlertActionType; label: string }[] = [
  { value: 'book', label: 'Book Now' },
  { value: 'transfer', label: 'Transfer Points' },
  { value: 'apply', label: 'Apply for Card' },
  { value: 'status_match', label: 'Status Match' },
  { value: 'buy_miles', label: 'Buy Miles / Points' },
  { value: 'monitor', label: 'Monitor This Deal' },
  { value: 'learn', label: 'Learn More' },
] as const
