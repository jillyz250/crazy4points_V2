/**
 * promo-persist.mjs — runtime persistence for the Promo Intelligence
 * Engine, ported from utils/scraper/persist.ts + utils/scraper/enrich.ts.
 *
 * Pure JS because scripts/run-scraper.mjs needs to import this at
 * runtime without a TS loader. The .ts versions in utils/scraper/ stay
 * for Next.js build-time imports.
 *
 * Mirror this file when changing persist.ts / enrich.ts. They're not
 * generated — they're hand-kept parallel.
 */

import { createHash } from 'node:crypto'

// ── Enrichment ────────────────────────────────────────────────────────

/**
 * Classify intel_type from the promo label, falling back to the
 * scraper config's default.
 */
function classifyType(row) {
  const label = (row.promo_label ?? '').toLowerCase()

  if (/transfer\s*(bonus|promotion)|\d+%\s*bonus.*transfer/.test(label)) {
    return 'transfer_bonus'
  }
  if (/spontaneous|flash|today only|24\s*hour/.test(label)) {
    return 'flash_sale'
  }
  if (/award sale|miles? sale/.test(label)) {
    return 'award_sale'
  }
  if (/status (match|challenge|fast.?track|promotion)/.test(label)) {
    return 'status_fast_track'
  }
  if (/chart (update|change|new)/.test(label)) {
    return 'chart_change'
  }

  return row.default_intel_type
}

function computeDiscountPercent(row) {
  if (!row.points_required || !row.points_baseline) return null
  if (row.points_baseline <= 0) return null
  const pct = ((row.points_baseline - row.points_required) / row.points_baseline) * 100
  if (pct <= 0) return null
  return Math.round(pct * 10) / 10
}

function computeValueScore(row) {
  let score = 0
  let hasSignal = false

  if (row.intel_discount_percent != null) {
    score += row.intel_discount_percent
    hasSignal = true
  }

  const cabin = (row.cabin ?? '').toLowerCase()
  if (cabin === 'business' || cabin === 'j') {
    score += 15
    hasSignal = true
  } else if (cabin === 'first' || cabin === 'f') {
    score += 25
    hasSignal = true
  }

  const label = (row.promo_label ?? '').toLowerCase()
  const dest = (row.dest_label ?? '').toLowerCase()
  if (
    /intercontinental|long.?haul|asia|europe|africa|south america|oceania|pacific/.test(
      `${label} ${dest}`,
    )
  ) {
    score += 10
    hasSignal = true
  }

  if (!hasSignal) return null
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10))
}

function readDisplayedDiscount(payload) {
  if (!payload) return null
  const candidates = ['discount_percent_displayed', 'discount_percent', 'discount']
  for (const key of candidates) {
    const v = payload[key]
    if (typeof v === 'number' && v > 0 && v < 100) return v
    if (typeof v === 'string') {
      const n = parseFloat(v.replace('%', '').trim())
      if (!isNaN(n) && n > 0 && n < 100) return n
    }
  }
  return null
}

function computeInferredBaseline(pointsRequired, discountPercent, explicitBaseline) {
  if (explicitBaseline != null) return null
  if (!pointsRequired || !discountPercent) return null
  if (discountPercent <= 0 || discountPercent >= 100) return null
  return Math.round(pointsRequired / (1 - discountPercent / 100))
}

export function enrichPromoRow(row) {
  const intel_type = classifyType(row)

  const displayedDiscount = readDisplayedDiscount(row.raw_payload)
  const intel_discount_percent = displayedDiscount ?? computeDiscountPercent(row)

  const intel_inferred_baseline = computeInferredBaseline(
    row.points_required,
    intel_discount_percent,
    row.points_baseline,
  )

  const intel_value_score = computeValueScore({ ...row, intel_discount_percent })

  return {
    intel_type,
    intel_discount_percent,
    intel_value_score,
    intel_inferred_baseline,
    intel_affects_redemption_ids: null,
    intel_affects_alert_ids: null,
    intel_match_confidence: 'unmatched',
  }
}

// ── Hashing ───────────────────────────────────────────────────────────

export function hashPromoRow(row) {
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

// ── Scrape run lifecycle ──────────────────────────────────────────────

export async function startScrapeRun(supabase, opts) {
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
  return data.id
}

export async function closeScrapeRun(supabase, runId, patch) {
  const { error } = await supabase
    .from('scrape_runs')
    .update(patch)
    .eq('id', runId)
  if (error) throw error
}

// ── Diff + persist ────────────────────────────────────────────────────

/**
 * Persist a batch of parsed rows.
 *
 * @param supabase  Supabase client (service-role)
 * @param parsedRows  Array of ParsedPromoRow-shaped objects (see persist.ts)
 * @param opts      { programId, scraperSlug, sourceUrl, defaultIntelType }
 * @param runId     The scrape_runs row id created by startScrapeRun
 * @returns         { items_seen, items_new, items_updated, items_disappeared }
 */
export async function persistPromoBatch(supabase, parsedRows, opts, runId) {
  const seen_hashes = new Set()
  let items_new = 0
  let items_updated = 0

  const { data: existingRaw, error: existingErr } = await supabase
    .from('promo_rewards')
    .select('id, raw_snapshot_hash, last_seen_active')
    .eq('program_id', opts.programId)
    .eq('source_url', opts.sourceUrl)
    .eq('last_seen_active', true)
  if (existingErr) throw existingErr

  const existingByHash = new Map(
    (existingRaw ?? []).map((r) => [r.raw_snapshot_hash, { id: r.id }]),
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
      // Note: ...enriched spreads include intel_inferred_baseline,
      // intel_type, intel_discount_percent, intel_value_score, and the
      // match_confidence + affects_* fields. Spreading after the raw
      // columns lets the enrichment overwrite if needed.
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
        // Dedupe-index collision — skip
        if (error.code === '23505') continue
        throw error
      }
      items_new++
    }
  }

  let items_disappeared = 0
  const allExistingHashes = Array.from(existingByHash.keys())
  const disappearedHashes = allExistingHashes.filter((h) => !seen_hashes.has(h))
  if (disappearedHashes.length > 0) {
    const { error, count } = await supabase
      .from('promo_rewards')
      .update(
        { last_seen_active: false, last_scraped_at: new Date().toISOString() },
        { count: 'exact' },
      )
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
