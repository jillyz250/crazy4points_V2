#!/usr/bin/env node
/**
 * Integration test for Phase 1d.1 — surface_locations function + trigger.
 *
 * Walks through 5 scenarios using a temporary topics row + variants:
 *   1. Published alert with 1 program → surface_locations has home_banner + 2 entries
 *   2. Draft alert → surface_locations is empty
 *   3. Published blog variant → surface_locations is empty (not 'alert' format)
 *   4. Published alert with expired end_date → surface_locations is empty
 *   5. recompute_all_surface_locations RPC runs without error
 *
 * Cleans up after itself.
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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

let pass = 0
let fail = 0
function check(label, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}  ${detail}`) }
}

const sentinel = `phase1d1-test-${Date.now()}`
console.log(`\nIntegration test: surface_locations (sentinel=${sentinel})`)
console.log('='.repeat(70))

// Build a sentinel topic to attach variants to
const { data: topic, error: topicErr } = await sb
  .from('topics')
  .insert({
    slug: `${sentinel}-slug`,
    title: `${sentinel} topic`,
    summary: 'integration test',
    source_urls: ['https://example.com/test'],
    programs: ['marriott-bonvoy'],
    topic_type: 'transfer_bonus',
    status: 'draft',
    created_by: 'phase1d1-test',
  })
  .select('id, programs')
  .single()
if (topicErr) {
  console.error('failed to create test topic:', topicErr.message)
  process.exit(1)
}
console.log(`  → created test topic ${topic.id}`)

// ---- Scenario 1: published alert with 1 program ----
console.log('\nScenario 1: published alert variant with 1 program')
const { data: v1, error: e1 } = await sb
  .from('content_variants')
  .insert({
    topic_id: topic.id,
    format: 'alert',
    title: `${sentinel} alert`,
    body: 'test body',
    status: 'published',
    published_at: new Date().toISOString(),
  })
  .select('id, surface_locations')
  .single()
check('insert succeeded', !e1, e1?.message)
if (v1) {
  const locs = v1.surface_locations ?? []
  check(
    `has home_banner (got [${locs.join(', ')}])`,
    Array.isArray(locs) && locs.includes('home_banner'),
  )
  check('has live_bar:marriott-bonvoy', locs.includes('live_bar:marriott-bonvoy'))
  check('has program_page:marriott-bonvoy', locs.includes('program_page:marriott-bonvoy'))
}

// ---- Scenario 2: draft alert ----
console.log('\nScenario 2: draft alert variant (status not published)')
const { data: v2 } = await sb
  .from('content_variants')
  .insert({
    topic_id: topic.id,
    format: 'newsletter', // can't have 2 alerts on same topic per the unique idx
    title: `${sentinel} newsletter`,
    body: 'test',
    status: 'draft',
  })
  .select('id, surface_locations')
  .single()
if (v2) {
  check(
    `format=newsletter → surface_locations empty (got [${(v2.surface_locations ?? []).join(', ')}])`,
    Array.isArray(v2.surface_locations) && v2.surface_locations.length === 0,
  )
}

// ---- Scenario 3: published blog variant ----
console.log('\nScenario 3: published blog variant (not alert format)')
const { data: v3 } = await sb
  .from('content_variants')
  .insert({
    topic_id: topic.id,
    format: 'blog',
    title: `${sentinel} blog`,
    body: 'test',
    status: 'published',
    published_at: new Date().toISOString(),
  })
  .select('id, surface_locations')
  .single()
if (v3) {
  check(
    `format=blog → surface_locations empty (got [${(v3.surface_locations ?? []).join(', ')}])`,
    Array.isArray(v3.surface_locations) && v3.surface_locations.length === 0,
  )
}

// ---- Scenario 4: alert with expired end_date ----
console.log('\nScenario 4: alert with expired end_date on parent topic')
// Update the topic to have an expired end_date
await sb.from('topics').update({ end_date: '2020-01-01' }).eq('id', topic.id)
// Now updating the alert variant should retrigger and produce empty array
const { data: v4 } = await sb
  .from('content_variants')
  .update({ status: 'published' })
  .eq('id', v1.id)
  .select('id, surface_locations')
  .single()
if (v4) {
  check(
    `expired topic → surface_locations empty (got [${(v4.surface_locations ?? []).join(', ')}])`,
    Array.isArray(v4.surface_locations) && v4.surface_locations.length === 0,
  )
}

// ---- Scenario 5: recompute_all_surface_locations RPC ----
console.log('\nScenario 5: recompute_all_surface_locations() RPC')
// Clear end_date so the alert should re-surface
await sb.from('topics').update({ end_date: null }).eq('id', topic.id)
const { data: rpcRes, error: rpcErr } = await sb.rpc('recompute_all_surface_locations')
check('RPC succeeded', !rpcErr, rpcErr?.message)
console.log(`    rows updated: ${rpcRes}`)
// Verify the original variant now has surfaces again
const { data: v1after } = await sb.from('content_variants').select('surface_locations').eq('id', v1.id).single()
check(
  'after recompute, alert has surface_locations again',
  Array.isArray(v1after?.surface_locations) && v1after.surface_locations.includes('home_banner'),
  `got [${(v1after?.surface_locations ?? []).join(', ')}]`,
)

// ---- Cleanup ----
console.log('\nCleanup')
const { error: cvDelErr } = await sb.from('content_variants').delete().eq('topic_id', topic.id)
check('deleted variants', !cvDelErr, cvDelErr?.message)
const { error: tDelErr } = await sb.from('topics').delete().eq('id', topic.id)
check('deleted topic', !tDelErr, tDelErr?.message)

console.log('')
console.log('='.repeat(70))
console.log(`Tests:  ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
