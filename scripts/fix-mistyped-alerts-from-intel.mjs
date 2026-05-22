#!/usr/bin/env node
/**
 * One-shot data fix — re-classify existing alerts from intel.alert_type.
 *
 * Background: PR #697 fixed the going-forward bug in triage/actions.ts
 * where Write + Stage actions read `intel.type` (undefined; correct
 * column is `intel.alert_type`). Every alert created via triage since
 * Wave 1 landed as `industry_news` regardless of Haiku's classification.
 *
 * This script restores Haiku's classification on existing rows:
 *   1. Find variants with status in (needs_review, published, archived)
 *   2. For each, look up source intel.alert_type via topic.metadata.source_intel_id
 *   3. If intel has a classification AND it differs from the variant's
 *      original_alert_type, update topic.topic_type + variant.metadata
 *      .original_alert_type accordingly, touch the variant so the
 *      trigger projects the corrected type to alerts.type
 *
 * Skips:
 *   • Variants with no source_intel_id (manually-created alerts)
 *   • Intel rows missing alert_type (Haiku couldn't classify)
 *   • Variants already matching the intel classification
 *
 * Run:
 *   node scripts/fix-mistyped-alerts-from-intel.mjs --dry-run
 *   node scripts/fix-mistyped-alerts-from-intel.mjs
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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
const sb = createClient(url, key)

const DRY_RUN = process.argv.includes('--dry-run')

// Mirrors TOPIC_TYPE_BY_ALERT_TYPE in utils/content/writeAlertVariant.ts.
// AlertType (28 values) → TopicType (22 + 'other').
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
}

function mapTopicType(alertType) {
  if (!alertType) return 'other'
  return TOPIC_TYPE_BY_ALERT_TYPE[alertType] ?? 'other'
}

async function main() {
  console.log(`Re-classify existing alerts from intel.alert_type${DRY_RUN ? ' (DRY RUN)' : ''}`)
  console.log('---')

  // Pull every variant in scope
  const { data: variants, error } = await sb
    .from('content_variants')
    .select('id, topic_id, status, metadata, topics:topics!inner(id, slug, topic_type, metadata)')
    .eq('format', 'alert')
    .in('status', ['needs_review', 'published', 'archived'])

  if (error) {
    console.error('Failed to load variants:', error.message)
    process.exit(1)
  }
  console.log(`Inspecting ${variants.length} variants`)

  let updates = 0
  let skippedNoIntel = 0
  let skippedNoClass = 0
  let skippedMatched = 0
  let errors = 0

  for (const v of variants) {
    const t = Array.isArray(v.topics) ? v.topics[0] : v.topics
    const sourceIntelId = t?.metadata?.source_intel_id
    if (!sourceIntelId) {
      skippedNoIntel++
      continue
    }

    const { data: intel } = await sb
      .from('intel_items')
      .select('alert_type, headline')
      .eq('id', sourceIntelId)
      .maybeSingle()
    if (!intel?.alert_type) {
      skippedNoClass++
      continue
    }

    const currentType = v.metadata?.original_alert_type
    if (currentType === intel.alert_type) {
      skippedMatched++
      continue
    }

    const newTopicType = mapTopicType(intel.alert_type)
    const newVariantMeta = { ...(v.metadata ?? {}), original_alert_type: intel.alert_type }

    if (DRY_RUN) {
      console.log(`[dry-run] ${t.slug}: ${currentType ?? '(null)'} → ${intel.alert_type} (topic_type: ${t.topic_type} → ${newTopicType})`)
      updates++
      continue
    }

    // Apply: update topic.topic_type + variant.metadata.original_alert_type, then touch variant
    try {
      await sb.from('topics').update({ topic_type: newTopicType }).eq('id', t.id)
      await sb
        .from('content_variants')
        .update({ metadata: newVariantMeta, updated_at: new Date().toISOString() })
        .eq('id', v.id)
      updates++
      console.log(`[fix] ${t.slug}: ${currentType ?? '(null)'} → ${intel.alert_type}`)
    } catch (err) {
      console.error(`  [err] ${t.slug}:`, err.message)
      errors++
    }
  }

  console.log('---')
  console.log(`Updated: ${updates}`)
  console.log(`Skipped (no source_intel_id): ${skippedNoIntel}`)
  console.log(`Skipped (intel had no alert_type): ${skippedNoClass}`)
  console.log(`Skipped (already matching): ${skippedMatched}`)
  console.log(`Errors: ${errors}`)
  if (DRY_RUN) console.log('\nDry run only — no rows written. Re-run without --dry-run to apply.')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
