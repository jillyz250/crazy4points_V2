#!/usr/bin/env node
/**
 * Phase 4 PR #1 preflight — validates data shape before migration 327 runs.
 *
 * Hard fails:
 *   • duplicate (format, short_slug) pairs (would block the partial unique idx)
 *   • action_type or confidence_level values not in the enum
 *   • non-int voice_score values in metadata
 *
 * Soft warnings (informational):
 *   • count of NULL short_slug rows
 *   • count of variants missing required-post-bake fields (helps size migration 329)
 *
 * Exits 0 if safe to migrate; 1 otherwise.
 *
 *   node scripts/phase4-preflight.mjs
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

// Mirror of the action_type Postgres enum on the alerts table. Update here
// when the enum gets new values (Migration 5x adds 'sell_miles' etc).
const VALID_ACTION_TYPES = new Set([
  'activate', 'apply', 'book', 'buy_miles', 'learn',
  'monitor', 'status_match', 'transfer',
])
const VALID_CONFIDENCE = new Set(['low', 'medium', 'high'])

async function main() {
  console.log('Phase 4 preflight — validating data before migration 327')
  console.log('---')

  let hardFail = 0
  let softWarn = 0

  // Pull every alert variant's relevant metadata in one shot
  const { data: variants, error } = await sb
    .from('content_variants')
    .select('id, format, metadata, status, created_at')
    .eq('format', 'alert')

  if (error) {
    console.error('FATAL: failed to load variants:', error.message)
    process.exit(1)
  }
  console.log(`Inspecting ${variants.length} alert variants`)

  // ───────────────────────────────────────────────────────────────────
  // 1. Duplicate (format, short_slug) pairs — would block partial unique idx
  // ───────────────────────────────────────────────────────────────────
  const slugSeen = new Map()
  const slugDupes = []
  for (const v of variants) {
    const slug = v.metadata?.short_slug
    if (!slug) continue
    if (slugSeen.has(slug)) {
      slugDupes.push({ slug, ids: [slugSeen.get(slug), v.id] })
    } else {
      slugSeen.set(slug, v.id)
    }
  }
  if (slugDupes.length > 0) {
    hardFail++
    console.error(`❌ HARD FAIL: ${slugDupes.length} duplicate short_slug values`)
    for (const d of slugDupes.slice(0, 5)) {
      console.error(`   ${d.slug}: ${d.ids.join(', ')}`)
    }
  } else {
    console.log(`✅ short_slug uniqueness: 0 dupes across ${slugSeen.size} non-null slugs`)
  }

  // ───────────────────────────────────────────────────────────────────
  // 2. Enum value validation
  // ───────────────────────────────────────────────────────────────────
  const badActionType = []
  const badConfidence = []
  const badVoiceScore = []
  for (const v of variants) {
    const m = v.metadata ?? {}
    if (m.action_type && !VALID_ACTION_TYPES.has(m.action_type)) {
      badActionType.push({ id: v.id, val: m.action_type })
    }
    if (m.confidence_level && !VALID_CONFIDENCE.has(m.confidence_level)) {
      badConfidence.push({ id: v.id, val: m.confidence_level })
    }
    if (m.voice_score !== undefined && m.voice_score !== null) {
      const n = Number(m.voice_score)
      if (!Number.isInteger(n)) badVoiceScore.push({ id: v.id, val: m.voice_score })
    }
  }

  if (badActionType.length > 0) {
    hardFail++
    console.error(`❌ HARD FAIL: ${badActionType.length} variants have invalid action_type`)
    for (const b of badActionType.slice(0, 5)) console.error(`   ${b.id}: ${b.val}`)
  } else {
    console.log('✅ action_type values: all valid enum members')
  }

  if (badConfidence.length > 0) {
    hardFail++
    console.error(`❌ HARD FAIL: ${badConfidence.length} variants have invalid confidence_level`)
    for (const b of badConfidence.slice(0, 5)) console.error(`   ${b.id}: ${b.val}`)
  } else {
    console.log('✅ confidence_level values: all valid enum members')
  }

  if (badVoiceScore.length > 0) {
    hardFail++
    console.error(`❌ HARD FAIL: ${badVoiceScore.length} variants have non-int voice_score`)
    for (const b of badVoiceScore.slice(0, 5)) console.error(`   ${b.id}: ${b.val}`)
  } else {
    console.log('✅ voice_score values: all int (or null)')
  }

  // ───────────────────────────────────────────────────────────────────
  // 3. Soft warnings — null rates for future NOT NULL flips (migration 329)
  // ───────────────────────────────────────────────────────────────────
  const nullCounts = { short_slug: 0, action_type: 0, voice_pass: 0, confidence_level: 0 }
  for (const v of variants) {
    const m = v.metadata ?? {}
    if (!m.short_slug) nullCounts.short_slug++
    if (!m.action_type) nullCounts.action_type++
    if (m.voice_pass === undefined || m.voice_pass === null) nullCounts.voice_pass++
    if (!m.confidence_level) nullCounts.confidence_level++
  }
  console.log('---')
  console.log('Null-rate report (informational — migration 327 ships all-nullable):')
  for (const [k, n] of Object.entries(nullCounts)) {
    const pct = ((n / variants.length) * 100).toFixed(1)
    console.log(`  ${k.padEnd(20)} ${n}/${variants.length} null (${pct}%)`)
    if (k === 'action_type' && n > 0) {
      console.log(`    ↳ migration 329 NOT NULL flip blocked until these rows backfill or get deleted`)
      softWarn++
    }
  }

  console.log('---')
  if (hardFail > 0) {
    console.error(`PREFLIGHT FAILED: ${hardFail} blocking issue(s). Fix data before running migration 327.`)
    process.exit(1)
  }
  if (softWarn > 0) {
    console.log(`PREFLIGHT PASSED (${softWarn} soft warning(s) — see null-rate report above)`)
  } else {
    console.log('PREFLIGHT PASSED — safe to apply migration 327')
  }
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
