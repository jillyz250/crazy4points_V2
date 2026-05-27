#!/usr/bin/env node
//
// scripts/restore-table.mjs — restore a single table from a JSON backup
// created by scripts/backup-all-data.mjs.
//
// USAGE
//   node scripts/restore-table.mjs --table=programs --from=/tmp/c4p-full-backup-2026-05-27
//   node scripts/restore-table.mjs --table=programs --from=... --truncate
//   node scripts/restore-table.mjs --table=programs --from=... --dry
//
// SAFETY
//   - Without --truncate, rows are upserted by primary key (id). Existing rows
//     stay; matching ids overwritten; new rows from backup inserted.
//   - With --truncate, the table is wiped first then re-inserted from backup.
//     DANGEROUS — only use when you intend a full point-in-time restore.
//   - --dry prints what would happen without writing.
//
// LIMITATIONS
//   - Foreign-key constraints can block inserts if the referenced rows are
//     also missing. Restore parent tables first.
//   - Sequences/auto-increment columns: this preserves ids verbatim, so no
//     issue for UUID PKs (all the tables we back up use UUIDs).
//   - This won't restore tables whose schema CHANGED since the backup.

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

try {
  const text = readFileSync('.env.local', 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
} catch {}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  }),
)

const table = typeof args.table === 'string' ? args.table : null
const from = typeof args.from === 'string' ? args.from : null
const truncate = !!args.truncate
const dryRun = !!args.dry

if (!table || !from) {
  console.error('Usage: restore-table.mjs --table=<name> --from=<backup-dir> [--truncate] [--dry]')
  process.exit(1)
}

const file = join(from, table + '.json')
if (!existsSync(file)) {
  console.error('Backup file not found: ' + file)
  process.exit(1)
}

const rows = JSON.parse(readFileSync(file, 'utf8'))
console.log('Loaded ' + rows.length + ' rows from ' + file)

if (dryRun) {
  console.log('(--dry — no DB writes)')
  console.log('Would ' + (truncate ? 'TRUNCATE + insert ' : 'upsert ') + rows.length + ' rows into ' + table)
  process.exit(0)
}

if (truncate) {
  console.log('TRUNCATE ' + table + ' (deleting all current rows)...')
  // Use a delete with always-true filter since Supabase REST has no truncate
  const { error: delErr } = await sb.from(table).delete().not('id', 'is', null)
  if (delErr) {
    console.error('Truncate failed: ' + delErr.message)
    process.exit(1)
  }
}

console.log((truncate ? 'Inserting' : 'Upserting') + ' ' + rows.length + ' rows into ' + table + '...')
const CHUNK = 500
let written = 0
let failures = 0
for (let i = 0; i < rows.length; i += CHUNK) {
  const slice = rows.slice(i, i + CHUNK)
  const op = truncate
    ? sb.from(table).insert(slice)
    : sb.from(table).upsert(slice, { onConflict: 'id' })
  const { error } = await op
  if (error) {
    console.error('  chunk ' + i + '-' + (i + slice.length) + ' FAILED: ' + error.message)
    failures += slice.length
  } else {
    written += slice.length
    process.stdout.write('.')
  }
}
console.log('\n\nWritten: ' + written + '/' + rows.length + ' rows')
if (failures > 0) console.log('Failed: ' + failures + ' rows')
