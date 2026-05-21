#!/usr/bin/env node
/**
 * Phase 3 Wave 1 — backfill existing alerts into topics + content_variants.
 *
 * For every alert in (published, expired, pending_review, draft):
 *   - upsert one `topics` row (idempotent on slug)
 *   - upsert one `content_variants` row with format='alert' (idempotent on
 *     (topic_id, format) via existing UNIQUE constraint)
 *
 * Skipped statuses: rejected, soft_rejected (still printed for audit).
 *
 * Public site is untouched — this only populates the new tables. Wave 2
 * will flip the read path; Wave 1 is the safety net.
 *
 * Run:
 *   node scripts/phase3-backfill-alerts-to-variants.mjs --dry-run   # show what would happen
 *   node scripts/phase3-backfill-alerts-to-variants.mjs             # write rows
 *
 * Rollback (within seconds of backfill):
 *   delete from content_variants where metadata->>'source' = 'alerts_backfill';
 *   delete from topics where metadata->>'source' = 'alerts_backfill';
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

try {
  const text = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
const sb = createClient(url, key)

const DRY_RUN = process.argv.includes('--dry-run')

// Status mapping ------------------------------------------------------------
// alerts.status (6 values) → topics.status (3 values) + variants.status (5 values).
//   draft         → topic=draft,    variant=draft
//   pending_review→ topic=active,   variant=needs_review
//   published     → topic=active,   variant=published
//   expired       → topic=active,   variant=published  (URL still live, end_date drives "stale")
//   rejected      → SKIP
//   soft_rejected → SKIP
function mapStatuses(alertStatus) {
  switch (alertStatus) {
    case 'draft':          return { topic: 'draft',    variant: 'draft' }
    case 'pending_review': return { topic: 'active',   variant: 'needs_review' }
    case 'published':      return { topic: 'active',   variant: 'published' }
    case 'expired':        return { topic: 'active',   variant: 'published' }
    default:               return null
  }
}

// Map alerts.type (28 values) → topics.topic_type (22 values).
// Topics has 'other' as a fallback; some alert types map directly, others fall back.
const TOPIC_TYPE_BY_ALERT_TYPE = {
  transfer_bonus: 'transfer_bonus',
  signup_bonus: 'signup_bonus',
  referral_bonus: 'referral_bonus',
  retention_offer: 'retention_offer',
  limited_time_offer: 'limited_time_offer',
  status_promo: 'status_promo',
  award_availability: 'award_availability',
  sweet_spot: 'sweet_spot',
  glitch: 'glitch',
  devaluation: 'devaluation',
  earn_rate_change: 'earn_rate_change',
  category_change: 'category_change',
  partner_change: 'partner_change',
  program_change: 'program_change',
  status_change: 'status_change',
  policy_change: 'policy_change',
  industry_news: 'industry_news',
  shopping_portal_bonus: 'shopping_portal_bonus',
  award_sale: 'award_sale',
  companion_pass: 'companion_pass',
  dining_bonus: 'dining_bonus',
  fee_change: 'fee_change',
  card_refresh: 'card_refresh',
  milestone_bonus: 'milestone_bonus',
  card_credit: 'card_credit',
  promo: 'promo',
  // alerts-only types that don't have direct topic equivalents
}
function mapTopicType(alertType) {
  if (!alertType) return 'other'
  return TOPIC_TYPE_BY_ALERT_TYPE[alertType] ?? 'other'
}

async function loadProgramSlugsFor(alertId) {
  const { data, error } = await sb
    .from('alert_programs')
    .select('programs:programs!alert_programs_program_id_fkey(slug)')
    .eq('alert_id', alertId)
  if (error) {
    console.error(`  [warn] alert_programs lookup failed for ${alertId}:`, error.message)
    return []
  }
  return (data ?? [])
    .map((r) => (r.programs && typeof r.programs === 'object' ? r.programs.slug : null))
    .filter((s) => typeof s === 'string')
}

function buildTopicRow(alert, programSlugs, statuses) {
  const editorialScores = {
    impact_score: alert.impact_score ?? null,
    value_score: alert.value_score ?? null,
    rarity_score: alert.rarity_score ?? null,
    computed_score: alert.computed_score ?? null,
    impact_justification: alert.impact_justification ?? null,
    is_hot: alert.is_hot ?? false,
    why_this_matters: alert.why_this_matters ?? null,
  }
  return {
    slug: alert.slug,
    title: alert.title,
    summary: alert.summary ?? null,
    topic_type: mapTopicType(alert.type),
    source_urls: alert.source_url ? [alert.source_url] : [],
    fact_ledger: Array.isArray(alert.fact_check_claims) ? alert.fact_check_claims : [],
    fact_check_status: alert.fact_check_at ? 'verified' : 'pending',
    verified_at: alert.fact_check_at ?? null,
    verified_by: null,
    programs: programSlugs,
    cards: [],
    end_date: alert.end_date ?? null,
    status: statuses.topic,
    created_by: alert.created_by ?? 'alerts_backfill',
    metadata: {
      source: 'alerts_backfill',
      backfilled_at: new Date().toISOString(),
      editorial_scores: editorialScores,
      original_alert_id: alert.id,
      original_alert_created_at: alert.created_at ?? null,
      original_alert_updated_at: alert.updated_at ?? null,
      source_intel_id: alert.source_intel_id ?? null,
      primary_program_id: alert.primary_program_id ?? null,
    },
  }
}

// Fields copied verbatim from alert → variant.metadata. `source` is renamed
// to `alerts_source` to avoid colliding with the provenance marker
// metadata.source = 'alerts_backfill'.
const BACKFILL_FIELDS_ON_VARIANT_METADATA = [
  'short_slug',
  'action_type',
  'start_date',
  'registration_required',
  'override_reason',
  'terms_waived_reason',
  'voice_pass',
  'voice_score',
  'voice_notes',
  'voice_checked_at',
  'voice_lead_mode',
  'originality_pass',
  'originality_notes',
  'originality_checked_at',
  'history_note',
  'revision_log',
  'confidence_level',
  'last_verified',
  'revisit_after',
  'gaps',
  'verified_terms',
]

function buildVariantRow(alert, topicId, statuses) {
  const variantMetadata = { source: 'alerts_backfill', _backfill_fields: [...BACKFILL_FIELDS_ON_VARIANT_METADATA, 'alerts_source', 'original_alert_type'] }
  for (const f of BACKFILL_FIELDS_ON_VARIANT_METADATA) {
    if (alert[f] !== undefined && alert[f] !== null) variantMetadata[f] = alert[f]
  }
  // alert.source → alerts_source (avoid key collision with provenance marker)
  if (alert.source !== undefined && alert.source !== null) variantMetadata.alerts_source = alert.source
  // alert.type → original_alert_type (topic.topic_type is a subset; preserve full original)
  if (alert.type !== undefined && alert.type !== null) variantMetadata.original_alert_type = alert.type

  const sourceHash = createHash('sha256')
    .update(`${alert.title ?? ''}|${alert.description ?? ''}`)
    .digest('hex')
  variantMetadata.source_hash = sourceHash

  return {
    topic_id: topicId,
    format: 'alert',
    title: alert.title,
    body: alert.description ?? null,
    metadata: variantMetadata,
    brand_voice_run: !!alert.voice_checked_at,
    fact_check_run: !!alert.fact_check_at,
    fact_check_results: null,
    status: statuses.variant,
    published_at: alert.published_at ?? null,
    publish_target_url: alert.slug ? `/alerts/${alert.slug}` : null,
    generated_by: 'editor',
    generation_prompt_version: null,
  }
}

// Main ---------------------------------------------------------------------
async function main() {
  console.log(`Phase 3 Wave 1 backfill — ${DRY_RUN ? 'DRY RUN' : 'LIVE WRITE'}`)
  console.log('---')

  const { data: alerts, error } = await sb
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load alerts:', error.message)
    process.exit(1)
  }

  let backfilled = 0
  let skipped = 0
  let collisions = 0
  let errors = 0

  for (const alert of alerts) {
    const statuses = mapStatuses(alert.status)
    if (!statuses) {
      console.log(`[skip] ${alert.slug} (status=${alert.status})`)
      skipped++
      continue
    }

    const programSlugs = await loadProgramSlugsFor(alert.id)
    const topicRow = buildTopicRow(alert, programSlugs, statuses)

    // Idempotency + collision check
    const { data: existingTopic } = await sb
      .from('topics')
      .select('id, topic_type, metadata')
      .eq('slug', alert.slug)
      .maybeSingle()

    let topicId
    if (existingTopic) {
      if (existingTopic.topic_type !== topicRow.topic_type) {
        console.log(`⚠️  ${alert.slug}: topic exists with topic_type=${existingTopic.topic_type}, alert wants ${topicRow.topic_type} — SKIPPING`)
        collisions++
        continue
      }
      topicId = existingTopic.id
      if (DRY_RUN) {
        console.log(`[dry-run] ${alert.slug} → topic exists (${topicId}), would update + upsert variant`)
      } else {
        // Update existing topic with the latest mapping (re-runs are how we patch
        // backfilled rows after the script changes shape).
        const { error: tuErr } = await sb
          .from('topics')
          .update({
            title: topicRow.title,
            summary: topicRow.summary,
            source_urls: topicRow.source_urls,
            fact_ledger: topicRow.fact_ledger,
            fact_check_status: topicRow.fact_check_status,
            verified_at: topicRow.verified_at,
            programs: topicRow.programs,
            end_date: topicRow.end_date,
            status: topicRow.status,
            metadata: topicRow.metadata,
          })
          .eq('id', topicId)
        if (tuErr) {
          console.error(`  [err] ${alert.slug} topic update failed:`, tuErr.message)
          errors++
          continue
        }
      }
    } else {
      if (DRY_RUN) {
        console.log(`[dry-run] ${alert.slug} → would insert topic + variant (status=${alert.status})`)
        backfilled++
        continue
      }
      const { data: newTopic, error: tErr } = await sb
        .from('topics')
        .insert(topicRow)
        .select('id')
        .single()
      if (tErr || !newTopic) {
        console.error(`  [err] ${alert.slug} topic insert failed:`, tErr?.message)
        errors++
        continue
      }
      topicId = newTopic.id
    }

    const variantRow = buildVariantRow(alert, topicId, statuses)
    if (DRY_RUN) {
      backfilled++
      continue
    }
    const { error: vErr } = await sb
      .from('content_variants')
      .upsert(variantRow, { onConflict: 'topic_id,format' })
    if (vErr) {
      console.error(`  [err] ${alert.slug} variant upsert failed:`, vErr.message)
      errors++
      continue
    }

    console.log(`[backfill] ${alert.slug} → topic ${topicId}, variant ok (status=${statuses.variant})`)
    backfilled++
  }

  console.log('---')
  console.log(`Eligible processed: ${backfilled}`)
  console.log(`Skipped (rejected/soft_rejected): ${skipped}`)
  console.log(`Slug collisions: ${collisions}`)
  console.log(`Errors: ${errors}`)
  if (DRY_RUN) console.log('\nDry run only — no rows written. Re-run without --dry-run to commit.')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
