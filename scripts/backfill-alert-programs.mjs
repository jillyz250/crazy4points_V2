/**
 * Backfill alert_programs for any alert that has primary_program_id set
 * but no matching role='primary' row in the junction. Runs the Scout
 * tagging fix retroactively across all existing alerts.
 *
 * Idempotent — safe to run multiple times. Will not delete or change
 * existing rows; only inserts the missing primary row.
 *
 * Usage:
 *   node scripts/backfill-alert-programs.mjs            # dry run + execute
 *   node scripts/backfill-alert-programs.mjs --dry-run  # report only, no writes
 *   node scripts/backfill-alert-programs.mjs --limit=50 # test on a subset
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const candidates = [
    resolve(process.cwd(), '.env.local'),
    '/Users/jillzeller/Desktop/Github/crazy4points_V2/.env.local',
  ]
  const path = candidates.find((p) => existsSync(p))
  if (!path) return
  const text = readFileSync(path, 'utf8')
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = (() => {
  const a = args.find((x) => x.startsWith('--limit='))
  return a ? parseInt(a.split('=')[1], 10) : null
})()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, key)

console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Backfilling alert_programs primary rows…`)

// 1. Pull every alert with a primary_program_id
let q = sb
  .from('alerts')
  .select('id, title, primary_program_id, status')
  .not('primary_program_id', 'is', null)
  .order('created_at', { ascending: true })
if (LIMIT) q = q.limit(LIMIT)
const { data: alerts, error: alertsErr } = await q
if (alertsErr) {
  console.error('Failed to fetch alerts:', alertsErr)
  process.exit(1)
}
console.log(`Found ${alerts.length} alerts with primary_program_id set.`)

// 2. Pull existing alert_programs rows so we know what's already covered
const { data: existing, error: existingErr } = await sb
  .from('alert_programs')
  .select('alert_id, program_id, role')
if (existingErr) {
  console.error('Failed to fetch existing alert_programs:', existingErr)
  process.exit(1)
}
const existingKey = (alertId, programId) => `${alertId}:${programId}`
const existingSet = new Set(existing.map((r) => existingKey(r.alert_id, r.program_id)))
const existingPrimaryByAlert = new Map(
  existing.filter((r) => r.role === 'primary').map((r) => [r.alert_id, r.program_id])
)

// 3. Decide what to insert
const toInsert = []
let alreadyPrimary = 0
let needsRoleUpgrade = 0
for (const a of alerts) {
  const has = existingSet.has(existingKey(a.id, a.primary_program_id))
  const isPrimary = existingPrimaryByAlert.get(a.id) === a.primary_program_id
  if (isPrimary) {
    alreadyPrimary++
    continue
  }
  if (has) {
    // Row exists but role != 'primary'. We could update — but to keep this
    // strictly additive for safety, count it and skip. Operator can decide
    // whether to flip the role manually.
    needsRoleUpgrade++
    continue
  }
  toInsert.push({
    alert_id: a.id,
    program_id: a.primary_program_id,
    role: 'primary',
  })
}

console.log(`  ✓ Already tagged as primary: ${alreadyPrimary}`)
console.log(`  ⤷ Existing row but not role='primary' (skipped): ${needsRoleUpgrade}`)
console.log(`  + To insert: ${toInsert.length}`)

if (DRY_RUN) {
  console.log('\n--dry-run — no writes performed.')
  if (toInsert.length > 0) {
    console.log('\nFirst 10 to insert:')
    for (const r of toInsert.slice(0, 10)) {
      const a = alerts.find((x) => x.id === r.alert_id)
      console.log(`  alert ${r.alert_id.slice(0, 8)}… [${a?.status}] "${a?.title?.slice(0, 60)}" → program ${r.program_id.slice(0, 8)}…`)
    }
  }
  process.exit(0)
}

if (toInsert.length === 0) {
  console.log('\nNothing to do.')
  process.exit(0)
}

// 4. Insert in batches
const BATCH = 100
let inserted = 0
for (let i = 0; i < toInsert.length; i += BATCH) {
  const slice = toInsert.slice(i, i + BATCH)
  const { error } = await sb.from('alert_programs').insert(slice)
  if (error) {
    console.error(`Batch starting at ${i} failed:`, error)
    process.exit(1)
  }
  inserted += slice.length
  process.stdout.write(`\rInserted ${inserted}/${toInsert.length}…`)
}
console.log(`\nDone. Inserted ${inserted} primary rows.`)
