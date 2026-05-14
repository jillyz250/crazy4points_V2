#!/usr/bin/env node
/**
 * Backfill script for the writer redesign — re-runs the new pipeline
 * (buildExtraContext + writeEditCheck w/ persona + voice gate) on every
 * pending_review alert from the last 30 days.
 *
 * Prerequisites:
 *   1. Migration 266 applied to prod Supabase.
 *   2. .env.local has SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY.
 *
 * Usage:
 *   node scripts/backfill-writer-redesign.mjs               # dry-run (lists targets)
 *   node scripts/backfill-writer-redesign.mjs --apply       # actually re-run
 *   node scripts/backfill-writer-redesign.mjs --apply --days=7  # narrower window
 *
 * Strategy:
 *   This script does NOT directly call the regenerate server action (which
 *   requires admin auth + redirects). Instead it invokes the production
 *   regenerate endpoint via fetch with the admin session cookie OR — simpler
 *   — exposes a CLI that hits the same logic through a wrapper.
 *
 * For now this script LISTS pending alerts in scope. The actual re-run
 * should be triggered by clicking "Regenerate Draft" on each one in the
 * admin UI, or by adding a "bulk regenerate" button (Phase 5b).
 */
import { readFileSync } from 'node:fs'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const daysArg = [...args].find((a) => a.startsWith('--days='))
const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 30

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}

const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
const url = new URL(`${supabaseUrl}/rest/v1/alerts`)
url.searchParams.set('status', 'eq.pending_review')
url.searchParams.set('select', 'id,title,type,source_intel_id,updated_at,voice_pass')
url.searchParams.set('updated_at', `gte.${since}`)
url.searchParams.set('order', 'updated_at.desc')

const res = await fetch(url, {
  headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
})
if (!res.ok) {
  console.error(`${res.status}: ${await res.text()}`)
  process.exit(1)
}
const rows = await res.json()

console.log(`Found ${rows.length} pending_review alerts updated in the last ${days} day(s):\n`)
for (const r of rows) {
  const flag = r.voice_pass === null ? '⚠️  needs voice check' : r.voice_pass ? '✅ voice pass' : '❌ voice fail'
  console.log(`  ${flag}  [${r.type}]  ${r.title}`)
  console.log(`     id: ${r.id} · intel: ${r.source_intel_id ?? '(none)'} · updated: ${r.updated_at}\n`)
}

if (!apply) {
  console.log('Dry-run only. Pass --apply to trigger regenerate on each (NOT YET IMPLEMENTED — use admin UI for now).')
  process.exit(0)
}

console.log('Bulk regenerate via this script is not yet implemented.')
console.log('Recommended: open admin → Alerts → filter pending_review, click Regenerate Draft on each.')
console.log('Future: expose a server action that takes an array of alert IDs and runs the regenerate loop with proper rate-limiting.')
