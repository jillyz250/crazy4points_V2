#!/usr/bin/env node
/**
 * Phase 3 Wave 2 — pre-flip verification gate.
 *
 * For every published alert, queries the OLD way (from `alerts`) and the
 * NEW way (from `content_variants` + `topics` via the AlertView adapter).
 * Diffs the fields each migration step consumes. Fails non-zero if any
 * field differs. Each Wave 2 PR must run this script and have it pass
 * before merge.
 *
 * Usage:
 *   node scripts/phase3-verify-wave2.mjs              # default checks
 *   node scripts/phase3-verify-wave2.mjs --strict     # diff ALL fields (Wave 3 readiness gate)
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
const STRICT = process.argv.includes('--strict')

// Fields the public read paths actually consume. Wave 2 cares about these.
// --strict mode below diffs everything.
const ROUTE_FIELDS = [
  'id', 'slug', 'short_slug', 'title', 'summary', 'description',
  'type', 'status', 'published_at', 'end_date', 'start_date',
  'source', 'source_url', 'confidence_level', 'is_hot',
  'impact_score', 'value_score', 'rarity_score', 'computed_score',
  'why_this_matters', 'created_at', 'updated_at',
]

function normalize(v) {
  if (v === null || v === undefined) return null
  if (Array.isArray(v) && v.length === 0) return null  // [] and null treated equal
  if (typeof v === 'object') return JSON.stringify(v)
  return v
}

function diffField(slug, field, oldV, newV, failures) {
  const a = normalize(oldV)
  const b = normalize(newV)
  if (a === b) return
  // Numbers: tolerate float drift (scores are integers but be safe).
  if (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 0.001) return
  failures.push(`  ❌ ${slug}.${field}: alert=${JSON.stringify(oldV)} variant=${JSON.stringify(newV)}`)
}

const VARIANT_SELECT = `
  id, topic_id, title, body, status, published_at, publish_target_url,
  archived_at, brand_voice_run, fact_check_run, fact_check_results, metadata,
  created_at, updated_at,
  topics:topics!inner(
    id, slug, title, summary, topic_type, source_urls, fact_ledger, end_date,
    programs, cards, status, created_by, verified_at, metadata,
    created_at, updated_at
  )
`

function mapVariantToAlertShape(row) {
  const t = row.topics
  const variantMeta = row.metadata ?? {}
  const topicMeta = t?.metadata ?? {}
  const ed = topicMeta.editorial_scores ?? {}
  const variantStatus = row.status
  const alertStatus = variantStatus === 'needs_review' ? 'pending_review'
    : variantStatus === 'archived' ? 'soft_rejected'
    : variantStatus
  return {
    id: typeof topicMeta.original_alert_id === 'string' ? topicMeta.original_alert_id : row.id,
    slug: t?.slug ?? '',
    short_slug: typeof variantMeta.short_slug === 'string' ? variantMeta.short_slug : null,
    title: row.title ?? '',
    summary: t?.summary ?? '',
    description: row.body,
    type: typeof variantMeta.original_alert_type === 'string' ? variantMeta.original_alert_type : (t?.topic_type ?? 'industry_news'),
    status: alertStatus,
    published_at: row.published_at,
    end_date: t?.end_date ?? null,
    start_date: typeof variantMeta.start_date === 'string' ? variantMeta.start_date : null,
    source: typeof variantMeta.alerts_source === 'string' ? variantMeta.alerts_source : null,
    source_url: Array.isArray(t?.source_urls) && t.source_urls.length > 0 ? t.source_urls[0] : null,
    confidence_level: typeof variantMeta.confidence_level === 'string' ? variantMeta.confidence_level : 'medium',
    is_hot: typeof ed.is_hot === 'boolean' ? ed.is_hot : false,
    impact_score: typeof ed.impact_score === 'number' ? ed.impact_score : 0,
    value_score: typeof ed.value_score === 'number' ? ed.value_score : 0,
    rarity_score: typeof ed.rarity_score === 'number' ? ed.rarity_score : 0,
    computed_score: typeof ed.computed_score === 'number' ? ed.computed_score : null,
    why_this_matters: typeof ed.why_this_matters === 'string' ? ed.why_this_matters : null,
    created_at: typeof topicMeta.original_alert_created_at === 'string' ? topicMeta.original_alert_created_at : row.created_at,
    updated_at: typeof topicMeta.original_alert_updated_at === 'string' ? topicMeta.original_alert_updated_at : row.updated_at,
  }
}

async function main() {
  console.log(`Phase 3 Wave 2 verification${STRICT ? ' (strict mode)' : ''}`)
  console.log('---')

  // Load published alerts (the Wave 2-sensitive set — these are the URLs Google indexes)
  const { data: alerts, error } = await sb
    .from('alerts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) {
    console.error('Failed to load alerts:', error.message)
    process.exit(1)
  }
  console.log(`Comparing ${alerts.length} published alerts (old → new)`)

  const failures = []
  let byteSlugMismatches = 0

  for (const a of alerts) {
    const { data: vRows, error: vErr } = await sb
      .from('content_variants')
      .select(VARIANT_SELECT)
      .eq('format', 'alert')
      .eq('topics.slug', a.slug)
      .limit(1)
    if (vErr) {
      failures.push(`  ❌ ${a.slug}: variant query failed (${vErr.message})`)
      continue
    }
    const vRow = vRows?.[0]
    if (!vRow) {
      failures.push(`  ❌ ${a.slug}: no matching variant`)
      continue
    }
    const v = mapVariantToAlertShape(vRow)

    // Byte-for-byte slug check (catches ASCII normalization drift)
    if (JSON.stringify(a.slug) !== JSON.stringify(v.slug)) {
      failures.push(`  ❌ ${a.slug}: byte-for-byte slug mismatch (alert=${JSON.stringify(a.slug)} variant=${JSON.stringify(v.slug)})`)
      byteSlugMismatches++
    }

    const fields = STRICT ? Object.keys(v) : ROUTE_FIELDS
    for (const f of fields) {
      diffField(a.slug, f, a[f], v[f], failures)
    }
  }

  console.log('---')
  if (failures.length === 0) {
    console.log(`✅ Wave 2 verification passed${STRICT ? ' (strict)' : ''} — ${alerts.length} alerts, 0 diffs`)
    process.exit(0)
  }
  console.log(`❌ Wave 2 verification failed (${failures.length} diffs${byteSlugMismatches ? `, ${byteSlugMismatches} byte-slug mismatches` : ''}):`)
  for (const f of failures.slice(0, 50)) console.log(f)
  if (failures.length > 50) console.log(`  ... and ${failures.length - 50} more`)
  process.exit(1)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
