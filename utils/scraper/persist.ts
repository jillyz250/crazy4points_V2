import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import type {
  PromoReward,
  IntelType,
  ScrapeStatus,
} from '@/utils/supabase/promoQueries'
import { enrichPromoRow, type PreEnrichmentRow } from './enrich'

/**
 * Persistence layer for the Promo Intelligence Engine.
 *
 * Handles:
 *   - creating a scrape_runs row at the start of an invocation
 *   - diffing parsed rows against existing promo_rewards
 *   - marking previously-seen rows as last_seen_active=false when they
 *     no longer appear in the latest scrape
 *   - enriching new + updated rows via enrichPromoRow()
 *   - inserting / updating promo_rewards
 *   - closing the scrape_runs row with counts + status
 */

/** Shape the scraper's selector config produces. */
export interface ParsedPromoRow {
  source_url: string
  external_id?: string | null
  promo_label?: string | null
  origin_iata?: string | null
  dest_iata?: string | null
  origin_label?: string | null
  dest_label?: string | null
  cabin?: string | null
  carrier_slug?: string | null
  points_required?: number | null
  points_baseline?: number | null
  cash_co_pay_amount?: number | null
  cash_co_pay_currency?: string | null
  valid_from?: string | null
  valid_to?: string | null
  booking_window_end?: string | null
  raw_payload?: Record<string, unknown> | null
}

export interface PersistOptions {
  programId: string
  scraperSlug: string
  sourceUrl: string
  defaultIntelType: IntelType
}

export interface PersistResult {
  runId: string
  items_seen: number
  items_new: number
  items_updated: number
  items_disappeared: number
}

/** Stable content hash for dedupe + diff detection. */
export function hashPromoRow(row: ParsedPromoRow): string {
  const canonical = JSON.stringify({
    source_url: row.source_url,
    external_id: row.external_id ?? null,
    promo_label: row.promo_label ?? null,
    origin_iata: row.origin_iata ?? null,
    dest_iata: row.dest_iata ?? null,
    origin_label: row.origin_label ?? null,
    dest_label: row.dest_label ?? null,
    cabin: row.cabin ?? null,
    carrier_slug: row.carrier_slug ?? null,
    points_required: row.points_required ?? null,
    points_baseline: row.points_baseline ?? null,
    cash_co_pay_amount: row.cash_co_pay_amount ?? null,
    valid_from: row.valid_from ?? null,
    valid_to: row.valid_to ?? null,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

/** Open a scrape_runs row at the start of a scrape. */
export async function startScrapeRun(
  supabase: SupabaseClient,
  opts: { programId: string; scraperSlug: string; sourceUrl: string },
): Promise<string> {
  const { data, error } = await supabase
    .from('scrape_runs')
    .insert({
      program_id: opts.programId,
      scraper_slug: opts.scraperSlug,
      source_url: opts.sourceUrl,
      status: 'success', // overwritten on close
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

/** Close a scrape_runs row with final counts. */
export async function closeScrapeRun(
  supabase: SupabaseClient,
  runId: string,
  patch: {
    status: ScrapeStatus
    duration_ms?: number
    items_seen?: number
    items_new?: number
    items_updated?: number
    items_disappeared?: number
    firecrawl_credits_used?: number
    error_log?: string
    raw_response_hash?: string
  },
): Promise<void> {
  const { error } = await supabase
    .from('scrape_runs')
    .update(patch)
    .eq('id', runId)
  if (error) throw error
}

/**
 * Persist a batch of parsed rows. Diffs against existing promo_rewards,
 * marks disappeared rows inactive, enriches new+updated rows, upserts.
 */
export async function persistPromoBatch(
  supabase: SupabaseClient,
  parsedRows: ParsedPromoRow[],
  opts: PersistOptions,
  runId: string,
): Promise<Omit<PersistResult, 'runId'>> {
  const seen_hashes = new Set<string>()
  let items_new = 0
  let items_updated = 0

  // Fetch existing active rows for this program + source so we can diff
  const { data: existingRaw, error: existingErr } = await supabase
    .from('promo_rewards')
    .select('id, raw_snapshot_hash, last_seen_active')
    .eq('program_id', opts.programId)
    .eq('source_url', opts.sourceUrl)
    .eq('last_seen_active', true)
  if (existingErr) throw existingErr

  const existingByHash = new Map<string, { id: string }>(
    (existingRaw ?? []).map((r) => [r.raw_snapshot_hash as string, { id: r.id as string }]),
  )

  for (const parsed of parsedRows) {
    const hash = hashPromoRow(parsed)
    seen_hashes.add(hash)

    const existing = existingByHash.get(hash)

    const enriched = enrichPromoRow({
      promo_label: parsed.promo_label ?? null,
      origin_iata: parsed.origin_iata ?? null,
      dest_iata: parsed.dest_iata ?? null,
      origin_label: parsed.origin_label ?? null,
      dest_label: parsed.dest_label ?? null,
      cabin: parsed.cabin ?? null,
      carrier_slug: parsed.carrier_slug ?? null,
      points_required: parsed.points_required ?? null,
      points_baseline: parsed.points_baseline ?? null,
      cash_co_pay_amount: parsed.cash_co_pay_amount ?? null,
      cash_co_pay_currency: parsed.cash_co_pay_currency ?? null,
      valid_from: parsed.valid_from ?? null,
      valid_to: parsed.valid_to ?? null,
      booking_window_end: parsed.booking_window_end ?? null,
      raw_payload: parsed.raw_payload ?? null,
      default_intel_type: opts.defaultIntelType,
    })

    if (existing) {
      // Already in DB with same content — just bump last_scraped_at.
      const { error } = await supabase
        .from('promo_rewards')
        .update({
          last_scraped_at: new Date().toISOString(),
          last_seen_active: true,
          scrape_run_id: runId,
        })
        .eq('id', existing.id)
      if (error) throw error
      items_updated++
    } else {
      // New row. Insert with enriched fields, default admin_status=pending.
      const { error } = await supabase.from('promo_rewards').insert({
        program_id: opts.programId,
        source_url: parsed.source_url,
        external_id: parsed.external_id ?? null,
        raw_snapshot_hash: hash,
        scrape_run_id: runId,
        promo_label: parsed.promo_label ?? null,
        origin_iata: parsed.origin_iata ?? null,
        dest_iata: parsed.dest_iata ?? null,
        origin_label: parsed.origin_label ?? null,
        dest_label: parsed.dest_label ?? null,
        cabin: parsed.cabin ?? null,
        carrier_slug: parsed.carrier_slug ?? null,
        points_required: parsed.points_required ?? null,
        points_baseline: parsed.points_baseline ?? null,
        cash_co_pay_amount: parsed.cash_co_pay_amount ?? null,
        cash_co_pay_currency: parsed.cash_co_pay_currency ?? null,
        valid_from: parsed.valid_from ?? null,
        valid_to: parsed.valid_to ?? null,
        booking_window_end: parsed.booking_window_end ?? null,
        raw_payload: parsed.raw_payload ?? null,
        ...enriched,
        admin_status: 'pending',
      })
      if (error) {
        // Likely a unique-index hit from the dedupe key — log + skip
        if (error.code === '23505') {
          continue
        }
        throw error
      }
      items_new++
    }
  }

  // Mark disappeared rows inactive
  let items_disappeared = 0
  const allExistingHashes = Array.from(existingByHash.keys())
  const disappearedHashes = allExistingHashes.filter((h) => !seen_hashes.has(h))
  if (disappearedHashes.length > 0) {
    const { error, count } = await supabase
      .from('promo_rewards')
      .update({ last_seen_active: false, last_scraped_at: new Date().toISOString() }, { count: 'exact' })
      .eq('program_id', opts.programId)
      .eq('source_url', opts.sourceUrl)
      .in('raw_snapshot_hash', disappearedHashes)
    if (error) throw error
    items_disappeared = count ?? disappearedHashes.length
  }

  return {
    items_seen: parsedRows.length,
    items_new,
    items_updated,
    items_disappeared,
  }
}
