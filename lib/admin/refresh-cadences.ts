/**
 * Per-entity refresh cadence policy for the admin refresh queue.
 *
 * MUST stay in sync with the SQL view `admin_refresh_queue` in
 * supabase/migrations/048_admin_refresh_queue.sql. If you change a cadence
 * here, write a follow-up migration that drops + recreates the view.
 *
 * Plan: plans/admin-refresh-queue.md
 */

export const REFRESH_CADENCE_DAYS = {
  credit_card: 90,
  credit_card_welcome_bonus: 30,
  issuer: 365,
  program_airline: 180,
  program_hotel: 180,
  program_credit_card: 180,
  program_car_rental: 365,
  program_cruise: 365,
  program_shopping_portal: 180,
  program_travel_portal: 180,
  program_lounge_network: 365,
  program_ota: 365,
  hotel_properties_program: 365,
} as const

export type RefreshEntityType = keyof typeof REFRESH_CADENCE_DAYS

export const REFRESH_ENTITY_LABELS: Record<RefreshEntityType, string> = {
  credit_card: 'Credit card',
  credit_card_welcome_bonus: 'Welcome bonus',
  issuer: 'Issuer',
  program_airline: 'Airline program',
  program_hotel: 'Hotel program',
  program_credit_card: 'Currency program',
  program_car_rental: 'Car-rental program',
  program_cruise: 'Cruise program',
  program_shopping_portal: 'Shopping portal',
  program_travel_portal: 'Travel portal',
  program_lounge_network: 'Lounge network',
  program_ota: 'OTA',
  hotel_properties_program: 'Hotel properties (program-wide)',
}

/**
 * Bucket an age (in days) into urgency level for UI coloring.
 * - on_time: under cadence
 * - overdue: between cadence and 2× cadence
 * - very_overdue: between 2× cadence and 3× cadence
 * - critical: >3× cadence (or last_verified is null/never)
 */
export function urgencyForAge(ageDays: number, cadenceDays: number): 'on_time' | 'overdue' | 'very_overdue' | 'critical' {
  if (ageDays <= cadenceDays) return 'on_time'
  if (ageDays <= cadenceDays * 2) return 'overdue'
  if (ageDays <= cadenceDays * 3) return 'very_overdue'
  return 'critical'
}
