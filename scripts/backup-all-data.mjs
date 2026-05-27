#!/usr/bin/env node
//
// scripts/backup-all-data.mjs — full row-level dump of critical tables.
//
// Backups go to /tmp/c4p-full-backup-<YYYY-MM-DD>/<table>.json (one file per
// table, raw JSON arrays). The directory also contains _summary.json with
// row counts + sizes.
//
// USAGE
//   node scripts/backup-all-data.mjs                  # full dump
//   node scripts/backup-all-data.mjs --tables=programs,program_facts  # subset
//
// Note: backups are NOT committed to git (PII in subscribers table + size).
// They live on local disk only. For long-term durability also rely on:
//   - Supabase automated backups (PITR on Pro tier; daily snapshot otherwise)
//   - Git tags for code rollback points
//
// To RESTORE from a backup, see scripts/restore-table.mjs.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
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

const DEFAULT_TABLES = [
  'programs', 'program_facts', 'prose_fact_links', 'subscribers',
  'content_ideas', 'alerts', 'credit_cards', 'hotel_properties',
  'transfer_bonus_observations', 'sources', 'issuers',
  'credit_card_benefits', 'credit_card_earn_rates', 'credit_card_welcome_bonuses',
  'partner_redemptions', 'alert_programs', 'alert_history', 'newsletters',
  'topics', 'intel_items',
]
const tables = typeof args.tables === 'string'
  ? args.tables.split(',').map((t) => t.trim())
  : DEFAULT_TABLES

const stamp = new Date().toISOString().slice(0, 10)
const dir = `/tmp/c4p-full-backup-${stamp}`
mkdirSync(dir, { recursive: true })
console.log('Dumping to ' + dir + '\n')

const PAGE = 1000
let totalBytes = 0
const summary = { taken_at: new Date().toISOString(), tables: {} }

for (const t of tables) {
  const rows = []
  let from = 0
  let err = null
  while (true) {
    const { data, error } = await sb.from(t).select('*').range(from, from + PAGE - 1)
    if (error) { err = error.message; break }
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  if (err) {
    console.log('  ' + t.padEnd(35) + ' ERROR ' + err)
    summary.tables[t] = { error: err }
    continue
  }
  const json = JSON.stringify(rows)
  writeFileSync(dir + '/' + t + '.json', json)
  totalBytes += json.length
  summary.tables[t] = { row_count: rows.length, bytes: json.length }
  console.log('  ' + t.padEnd(35) + ' ' + String(rows.length).padStart(6) + ' rows  ' + (json.length / 1024).toFixed(1).padStart(8) + ' KB')
}

writeFileSync(dir + '/_summary.json', JSON.stringify(summary, null, 2))
console.log('\nTotal: ' + (totalBytes / 1024 / 1024).toFixed(2) + ' MB across ' + tables.length + ' tables')
console.log('Backup directory: ' + dir)
console.log('\nTo restore a table: node scripts/restore-table.mjs --table=<name> --from=' + dir)
