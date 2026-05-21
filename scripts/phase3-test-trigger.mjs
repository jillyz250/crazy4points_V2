#!/usr/bin/env node
/**
 * Phase 3 Wave 1 — live integration test for the dual-write trigger.
 *
 * Exercises every status transition end-to-end against the real DB.
 * Inserts a test alert, verifies the trigger fires, runs through the full
 * lifecycle (update → soft-reject → revive), then deletes the test rows.
 *
 * Run: node scripts/phase3-test-trigger.mjs
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
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

const SLUG = `phase3-trigger-test-${Date.now()}`
let alertId
let topicId

function fail(msg) {
  console.error(`❌ ${msg}`)
  process.exit(1)
}

async function loadVariant() {
  const { data: t } = await sb.from('topics').select('id, status, slug').eq('slug', SLUG).maybeSingle()
  if (!t) return { topic: null, variant: null }
  topicId = t.id
  const { data: v } = await sb
    .from('content_variants')
    .select('id, title, body, status, archived_at')
    .eq('topic_id', t.id)
    .eq('format', 'alert')
    .maybeSingle()
  return { topic: t, variant: v }
}

async function cleanup() {
  if (alertId) await sb.from('alerts').delete().eq('id', alertId)
  if (topicId) await sb.from('topics').delete().eq('id', topicId)
}

async function main() {
  console.log(`Test slug: ${SLUG}`)
  console.log('---')

  // Step 1 — insert pending_review alert
  console.log('Step 1: insert pending_review alert')
  const { data: a, error: aErr } = await sb
    .from('alerts')
    .insert({
      slug: SLUG,
      short_slug: SLUG.slice(0, 24),
      title: 'Phase 3 trigger test',
      summary: 'Integration test — safe to delete',
      description: 'This row exists only to test the alerts→variants dual-write trigger.',
      status: 'pending_review',
      type: 'industry_news',
      impact_score: 1,
      value_score: 1,
      rarity_score: 1,
      impact_justification: 'test',
      confidence_level: 'low',
      source: 'phase3-test',
      action_type: 'monitor',
    })
    .select('id')
    .single()
  if (aErr || !a) fail(`alert insert failed: ${aErr?.message}`)
  alertId = a.id

  await new Promise((r) => setTimeout(r, 300))
  let { topic, variant } = await loadVariant()
  if (!topic) fail('no topic after insert')
  if (!variant) fail('no variant after insert')
  if (variant.status !== 'needs_review') fail(`expected variant.status=needs_review, got ${variant.status}`)
  if (variant.title !== 'Phase 3 trigger test') fail(`title mismatch: ${variant.title}`)
  console.log(`  ✓ topic + variant created, variant.status=${variant.status}`)

  // Step 2 — update title
  console.log('Step 2: update title')
  await sb.from('alerts').update({ title: 'Phase 3 trigger test — edited' }).eq('id', alertId)
  await new Promise((r) => setTimeout(r, 300))
  ;({ variant } = await loadVariant())
  if (variant.title !== 'Phase 3 trigger test — edited') fail(`title not propagated: ${variant.title}`)
  console.log(`  ✓ variant.title updated`)

  // Step 3 — soft-reject
  console.log('Step 3: soft-reject alert')
  await sb.from('alerts').update({ status: 'soft_rejected' }).eq('id', alertId)
  await new Promise((r) => setTimeout(r, 300))
  ;({ variant } = await loadVariant())
  if (variant.status !== 'archived') fail(`expected archived, got ${variant.status}`)
  if (!variant.archived_at) fail(`archived_at not set`)
  console.log(`  ✓ variant.status=archived, archived_at set`)

  // Step 4 — revive
  console.log('Step 4: revive (status → pending_review)')
  await sb.from('alerts').update({ status: 'pending_review' }).eq('id', alertId)
  await new Promise((r) => setTimeout(r, 300))
  ;({ variant } = await loadVariant())
  if (variant.status !== 'needs_review') fail(`revive: expected needs_review, got ${variant.status}`)
  if (variant.archived_at !== null) fail(`revive: archived_at should be cleared, got ${variant.archived_at}`)
  console.log(`  ✓ variant returned to needs_review, archived_at cleared`)

  // Cleanup
  console.log('Cleanup: deleting test rows')
  await cleanup()

  console.log('---')
  console.log('✅ Trigger integration test passed')
}

main().catch(async (err) => {
  console.error('FATAL:', err)
  await cleanup()
  process.exit(1)
})
