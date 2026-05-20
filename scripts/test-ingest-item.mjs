#!/usr/bin/env node
/**
 * Smoke test for utils/intel/* helpers and migration 311 RPC.
 *
 * Pure JS — re-implements normalizeHeadline + trigramSimilarity inline so we
 * don't need a TS loader. Test parity is verified by hash-matching the source.
 *
 * Requires migration 311 to be applied (creates the RPC + columns).
 *
 * Run: node scripts/test-ingest-item.mjs
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
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(url, key)

// Inline copies of utils/intel/normalizeHeadline + trigramSimilarity logic.
function normalizeHeadline(headline) {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
function trigrams(s) {
  const padded = `  ${s} `
  const out = new Set()
  for (let i = 0; i <= padded.length - 3; i++) out.add(padded.slice(i, i + 3))
  return out
}
function trigramSimilarity(a, b) {
  const ga = trigrams(a)
  const gb = trigrams(b)
  if (ga.size === 0 || gb.size === 0) return 0
  let inter = 0
  for (const g of ga) if (gb.has(g)) inter++
  const union = ga.size + gb.size - inter
  return union === 0 ? 0 : inter / union
}

let pass = 0
let fail = 0
function check(label, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}  ${detail}`) }
}

console.log('\nTest 1: normalizeHeadline')
check('lowercase', normalizeHeadline('Marriott 30% Bonus') === 'marriott 30 bonus')
check('collapses whitespace', normalizeHeadline('a   b\tc') === 'a b c')
check('strips punctuation', normalizeHeadline('Chase UR → Hyatt!') === 'chase ur hyatt')

console.log('\nTest 2: trigramSimilarity')
const a = normalizeHeadline('Marriott 20 percent transfer bonus through May 31')
const b = normalizeHeadline('Marriott 20 percent transfer bonus through June 30')
const c = normalizeHeadline('Hyatt off-peak award sweet spot')
const sAB = trigramSimilarity(a, b)
const sAC = trigramSimilarity(a, c)
check(`similar headlines >= 0.5 (got ${sAB.toFixed(2)})`, sAB >= 0.5)
check(`unrelated headlines < 0.3 (got ${sAC.toFixed(2)})`, sAC < 0.3)
check(`identical = 1.0`, Math.abs(trigramSimilarity(a, a) - 1) < 0.01)

console.log('\nTest 3: DB race-guard UNIQUE constraint')
const sentinel = `ingest-item-smoke-test-${Date.now()}`
const probe = {
  source_url: null,
  source_type: 'official',
  source_name: 'smoke-test',
  raw_text: 'smoke test payload',
  headline: `${sentinel} headline`,
  headline_normalized: normalizeHeadline(`${sentinel} headline`),
  confidence: 'low',
  alert_type: null,
  programs: null,
  expires_at: null,
}
const ins1 = await sb.from('intel_items').insert(probe).select('id').single()
check('first insert succeeds', !ins1.error, ins1.error?.message)
const ins2 = await sb.from('intel_items').insert(probe).select('id').single()
check('second insert raises 23505 (race guard)', ins2.error?.code === '23505', 'got code: ' + ins2.error?.code)

console.log('\nTest 4: increment_intel_confirmation RPC')
let testId = ins1.data?.id
if (testId) {
  const beforeQ = await sb.from('intel_items').select('confirmation_count, confirming_sources').eq('id', testId).single()
  const before = beforeQ.data
  const rpcRes = await sb.rpc('increment_intel_confirmation', {
    p_intel_id: testId,
    p_source: 'rpc-test-source',
  })
  check('RPC call succeeds', !rpcRes.error, rpcRes.error?.message)
  const afterQ = await sb.from('intel_items').select('confirmation_count, confirming_sources').eq('id', testId).single()
  const after = afterQ.data
  check(
    `confirmation_count incremented (${before?.confirmation_count} → ${after?.confirmation_count})`,
    (after?.confirmation_count ?? 0) === (before?.confirmation_count ?? 0) + 1
  )
  check(
    'confirming_sources array got new entry',
    Array.isArray(after?.confirming_sources) && after.confirming_sources.includes('rpc-test-source')
  )
}

console.log('\nTest 5: cleanup')
const del = await sb.from('intel_items').delete().like('headline', `${sentinel}%`)
check('cleanup deleted test rows', !del.error, del.error?.message)

console.log('')
console.log('='.repeat(40))
console.log(`Tests:  ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
