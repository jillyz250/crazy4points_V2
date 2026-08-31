#!/usr/bin/env node
/**
 * READ-ONLY diagnostic: characterize the undecided intel_items backlog.
 * Run: node scripts/diag-triage-backlog.mjs
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// env.local is at the git root (worktrees don't share untracked files)
for (const p of [join(process.cwd(), '.env.local'), join(process.cwd(), '../../../.env.local')]) {
  try {
    const text = readFileSync(p, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  } catch {}
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing SUPABASE creds'); process.exit(1) }
const sb = createClient(url, key)

const now = Date.now()
const daysAgo = (n) => new Date(now - n * 86400000).toISOString()

// The exact "undecided" definition the health check + build-brief backlog use.
async function countUndecided() {
  const { count } = await sb
    .from('intel_items')
    .select('id', { count: 'exact', head: true })
    .is('triage_decision', null)
    .is('rejected_at', null)
    .is('archived_at', null)
    .is('alert_id', null)
  return count
}

const totalUndecided = await countUndecided()
console.log(`\n=== UNDECIDED (triage_decision null, not rejected/archived/alerted): ${totalUndecided} ===`)

// Also the looser "processed=false" view
const { count: unprocessed } = await sb
  .from('intel_items').select('id', { count: 'exact', head: true }).eq('processed', false)
console.log(`processed=false rows: ${unprocessed}`)

// Age distribution of undecided
const buckets = [
  ['<24h', daysAgo(1), null],
  ['1-3d', daysAgo(3), daysAgo(1)],
  ['3-7d', daysAgo(7), daysAgo(3)],
  ['7-14d', daysAgo(14), daysAgo(7)],
  ['14-30d', daysAgo(30), daysAgo(14)],
  ['>30d', null, daysAgo(30)],
]
console.log('\n=== Age distribution (undecided) ===')
for (const [label, gte, lt] of buckets) {
  let q = sb.from('intel_items').select('id', { count: 'exact', head: true })
    .is('triage_decision', null).is('rejected_at', null).is('archived_at', null).is('alert_id', null)
  if (gte) q = q.gte('created_at', gte)
  if (lt) q = q.lt('created_at', lt)
  const { count } = await q
  console.log(`  ${label.padEnd(8)}: ${count}`)
}

// Oldest undecided
const { data: oldest } = await sb.from('intel_items')
  .select('id, created_at, source_name, headline')
  .is('triage_decision', null).is('rejected_at', null).is('archived_at', null).is('alert_id', null)
  .order('created_at', { ascending: true }).limit(3)
console.log('\n=== Oldest undecided ===')
for (const r of oldest ?? []) {
  const ageDays = Math.round((now - new Date(r.created_at).getTime()) / 86400000)
  console.log(`  ${ageDays}d  ${r.source_name} — ${String(r.headline).slice(0, 70)}`)
}

// Expired-but-undecided (should have been swept)
const { count: expiredUndecided } = await sb.from('intel_items')
  .select('id', { count: 'exact', head: true })
  .is('triage_decision', null).is('rejected_at', null).is('archived_at', null).is('alert_id', null)
  .not('expires_at', 'is', null).lt('expires_at', new Date(now).toISOString())
console.log(`\nExpired-but-undecided (route drops these from planner, never marked): ${expiredUndecided}`)

// Distribution of triage_decision across ALL non-rejected/archived rows (what HAS been decided)
console.log('\n=== triage_decision distribution (all rows) ===')
for (const val of ['approved', 'rejected', 'newsletter_idea']) {
  const { count } = await sb.from('intel_items').select('id', { count: 'exact', head: true }).eq('triage_decision', val)
  console.log(`  ${val.padEnd(16)}: ${count}`)
}
const { count: nullDecision } = await sb.from('intel_items').select('id', { count: 'exact', head: true }).is('triage_decision', null)
console.log(`  ${'(null)'.padEnd(16)}: ${nullDecision}`)

// source_name distribution of undecided (top sources feeding the leak)
const { data: undecidedRows } = await sb.from('intel_items')
  .select('source_name')
  .is('triage_decision', null).is('rejected_at', null).is('archived_at', null).is('alert_id', null)
  .limit(2000)
const bySource = {}
for (const r of undecidedRows ?? []) bySource[r.source_name ?? '(none)'] = (bySource[r.source_name ?? '(none)'] || 0) + 1
console.log('\n=== Top sources among undecided ===')
Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([s, c]) => console.log(`  ${String(c).padStart(4)}  ${s}`))

// Recent system_errors for build-brief
const { data: errs } = await sb.from('system_errors')
  .select('created_at, source, message')
  .in('source', ['build-brief', 'brief'])
  .order('created_at', { ascending: false }).limit(10)
console.log('\n=== Recent system_errors (build-brief/brief) ===')
if (!errs?.length) console.log('  (none)')
for (const e of errs ?? []) console.log(`  ${e.created_at?.slice(0,16)}  [${e.source}] ${String(e.message).slice(0,90)}`)

// Recent daily_briefs — did the brief run + how many decisions
const { data: briefs } = await sb.from('daily_briefs')
  .select('brief_date, intel_count, sent_at').order('brief_date', { ascending: false }).limit(7)
console.log('\n=== Recent daily_briefs ===')
for (const b of briefs ?? []) console.log(`  ${b.brief_date}  intel_count=${b.intel_count}  sent=${b.sent_at?.slice(0,16) ?? 'no'}`)

process.exit(0)
