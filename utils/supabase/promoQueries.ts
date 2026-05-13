import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Promo Intelligence Engine types + queries.
 *
 * See plans/promo-scraper.md for the full architecture.
 * Tables created in Migration 251.
 */

export type IntelType =
  | 'monthly_promo'
  | 'transfer_bonus'
  | 'award_sale'
  | 'flash_sale'
  | 'partner_discount'
  | 'status_fast_track'
  | 'chart_change'
  | 'partner_change'

export type MatchConfidence = 'high' | 'medium' | 'low' | 'unmatched'

export type AdminStatus =
  | 'pending'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'ignored'

export type ScrapeStatus = 'success' | 'partial' | 'failed'

export interface PromoReward {
  id: string

  // Identity / source
  program_id: string | null
  source_url: string
  external_id: string | null
  raw_snapshot_hash: string

  // Scrape lifecycle
  first_scraped_at: string
  last_scraped_at: string
  last_seen_active: boolean
  scrape_run_id: string | null

  // Raw promo data
  promo_label: string | null
  origin_iata: string | null
  dest_iata: string | null
  origin_label: string | null
  dest_label: string | null
  cabin: string | null
  carrier_slug: string | null
  points_required: number | null
  points_baseline: number | null
  cash_co_pay_amount: number | null
  cash_co_pay_currency: string | null
  valid_from: string | null
  valid_to: string | null
  booking_window_end: string | null
  raw_payload: Record<string, unknown> | null

  // Intelligence layer
  intel_type: IntelType | null
  intel_discount_percent: number | null
  intel_value_score: number | null
  intel_affects_redemption_ids: string[] | null
  intel_affects_alert_ids: string[] | null
  intel_match_confidence: MatchConfidence | null

  // Admin queue lifecycle
  admin_status: AdminStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null

  created_at: string
  updated_at: string
}

export interface ScrapeRun {
  id: string
  program_id: string | null
  scraper_slug: string
  source_url: string
  ran_at: string
  duration_ms: number | null
  status: ScrapeStatus
  items_seen: number | null
  items_new: number | null
  items_updated: number | null
  items_disappeared: number | null
  firecrawl_credits_used: number | null
  error_log: string | null
  raw_response_hash: string | null
}

export interface ChartSnapshot {
  id: string
  program_id: string | null
  source_url: string
  snapshot_hash: string
  snapshot_text: string | null
  taken_at: string
}

// ── Queue queries (admin) ────────────────────────────────────────────

/** Pending promos awaiting curator review. Ordered by intel score desc. */
export async function getPendingPromos(
  supabase: SupabaseClient,
  limit = 50,
): Promise<PromoReward[]> {
  const { data, error } = await supabase
    .from('promo_rewards')
    .select('*')
    .eq('admin_status', 'pending')
    .eq('last_seen_active', true)
    .order('intel_value_score', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as PromoReward[]
}

/** Approved-but-not-yet-published rows. */
export async function getApprovedPromos(
  supabase: SupabaseClient,
  limit = 50,
): Promise<PromoReward[]> {
  const { data, error } = await supabase
    .from('promo_rewards')
    .select('*')
    .eq('admin_status', 'approved')
    .eq('last_seen_active', true)
    .order('intel_value_score', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as PromoReward[]
}

/** Recently-reviewed rows (any terminal status). */
export async function getRecentReviewedPromos(
  supabase: SupabaseClient,
  limit = 50,
): Promise<PromoReward[]> {
  const { data, error } = await supabase
    .from('promo_rewards')
    .select('*')
    .in('admin_status', ['published', 'rejected', 'ignored'])
    .order('reviewed_at', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as PromoReward[]
}

// ── Public-surface queries ───────────────────────────────────────────

/**
 * Active published promos for a given program. Used by /programs/[slug]
 * "Active Promos" section. Auto-filters rows that have gone stale
 * (last_seen_active = false) or whose valid_to has passed.
 */
export async function getActivePromosForProgram(
  supabase: SupabaseClient,
  programId: string,
): Promise<PromoReward[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('promo_rewards')
    .select('*')
    .eq('program_id', programId)
    .eq('admin_status', 'published')
    .eq('last_seen_active', true)
    .or(`valid_to.gte.${today},valid_to.is.null`)
    .order('intel_value_score', { ascending: false, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as PromoReward[]
}

// ── Scrape run queries ───────────────────────────────────────────────

export async function getRecentScrapeRuns(
  supabase: SupabaseClient,
  limit = 50,
): Promise<ScrapeRun[]> {
  const { data, error } = await supabase
    .from('scrape_runs')
    .select('*')
    .order('ran_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as ScrapeRun[]
}
