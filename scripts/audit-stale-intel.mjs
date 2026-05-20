#!/usr/bin/env node
/**
 * Read-only audit of the intel_items backlog.
 *
 * Counts rows matching each "dead weight" criterion so we can decide what to
 * mass-archive before the content-pipeline overhaul.
 *
 * Run: node scripts/audit-stale-intel.mjs
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

const now = new Date()
const days = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

function fmt(label, n, extra = '') {
  const pad = label.padEnd(58, '.')
  console.log(`${pad} ${String(n).padStart(5)} ${extra}`)
}

async function count(label, query, extra = '') {
  const { count: n, error } = await query
  if (error) {
    console.log(`${label.padEnd(58, '.')}  ERROR  ${error.message}`)
    return 0
  }
  fmt(label, n ?? 0, extra)
  return n ?? 0
}

console.log('\nINTEL BACKLOG AUDIT — ' + now.toISOString())
console.log('='.repeat(78))

// --- Totals ---
console.log('\nTotals:')
await count(
  '  All intel_items',
  sb.from('intel_items').select('*', { count: 'exact', head: true })
)
await count(
  '  Unprocessed (processed=false)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .eq('processed', false)
)
await count(
  '  Promoted to alert (alert_id IS NOT NULL)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .not('alert_id', 'is', null)
)

// --- Rejection state (using rejected_at — actual column) ---
console.log('\nRejection state:')
await count(
  '  Rejected (rejected_at IS NOT NULL)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .not('rejected_at', 'is', null)
)
await count(
  '  Not rejected (rejected_at IS NULL)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .is('rejected_at', null)
)
await count(
  '  Dedup-blocked (dedup_count > 0)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .gt('dedup_count', 0)
)

// --- Dead-weight candidates ---
console.log('\nDead-weight candidates (mass-archive targets):')

await count(
  '  A. Expired (expires_at < now)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .lt('expires_at', now.toISOString())
    .not('expires_at', 'is', null)
)

await count(
  '  B. Rejected > 30 days ago (rejected_at)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .not('rejected_at', 'is', null)
    .lt('rejected_at', days(30))
)

await count(
  '  C. Untouched orphans > 30 days (unprocessed, no alert, not rejected)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .eq('processed', false)
    .is('alert_id', null)
    .is('rejected_at', null)
    .lt('created_at', days(30))
)

await count(
  '  D. Low confidence > 14 days, no alert, not rejected',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .eq('confidence', 'low')
    .is('alert_id', null)
    .is('rejected_at', null)
    .lt('created_at', days(14))
)

await count(
  '  E. Low confidence > 7 days, no alert, not rejected (looser)',
  sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .eq('confidence', 'low')
    .is('alert_id', null)
    .is('rejected_at', null)
    .lt('created_at', days(7))
)

// --- Dup hints ---
console.log('\nDup hints (Scout has no cross-run dedup):')

{
  const { count: total } = await sb
    .from('intel_items')
    .select('*', { count: 'exact', head: true })
    .not('source_url', 'is', null)
  const { data: uniq } = await sb
    .from('intel_items')
    .select('source_url')
    .not('source_url', 'is', null)
    .limit(50000)
  const unique = new Set((uniq || []).map((r) => r.source_url)).size
  fmt('  Rows with source_url', total ?? 0)
  fmt('  Unique source_urls', unique)
  fmt('  Apparent duplicates (rows - unique)', (total ?? 0) - unique)
}

// --- A few sample old rows ---
console.log('\nSample of oldest 5 untouched items (no alert, not rejected, unprocessed):')
const { data: oldest } = await sb
  .from('intel_items')
  .select('id, created_at, headline, source_name, confidence')
  .is('alert_id', null)
  .is('rejected_at', null)
  .eq('processed', false)
  .order('created_at', { ascending: true })
  .limit(5)
for (const r of oldest || []) {
  console.log(
    `  ${r.created_at.slice(0, 10)}  [${r.confidence}]  ${r.source_name}`
  )
  console.log(`    ${r.headline}`)
}

console.log('\nNext step: review counts above, then write archive SQL.')
console.log('No data was modified by this script.\n')
