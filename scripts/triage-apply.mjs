#!/usr/bin/env node
/**
 * triage-apply — apply a triage decision to specific intel_items BY ID.
 *
 * WHY THIS EXISTS (learned 2026-08-14): the morning ritual used to reject dupes
 * by hand-writing throwaway scripts with substring filters. A blunt
 * `headline.includes('aeroplan')` once swept in 5 non-dupes (a $2.5B stake sale,
 * partnership news) alongside the real re-forwards. The fix: never re-derive the
 * match — act on the exact IDs the snapshot already flagged, through one vetted
 * helper that writes the correct columns every time.
 *
 * Decisions (mirror the daily-ritual cheat-sheet + toggleReminderDone):
 *   --reject       rejected_at=now, processed=true, rejected_reason=<reason>
 *   --snooze       snoozed_until=<--until date>        (re-surfaces later)
 *   --restore      undo: rejected_at/processed/triage_decision/snoozed_until cleared
 *
 * IDs may be full UUIDs or unambiguous 8+ char prefixes (resolved against intel
 * from the last 21 days). Unknown/ambiguous prefixes abort the whole run — it
 * never guesses.
 *
 * Usage:
 *   node scripts/triage-apply.mjs --reject <id> <id> ... [--reason "duplicate of live alert"]
 *   node scripts/triage-apply.mjs --snooze <id> ... --until 2026-09-01
 *   node scripts/triage-apply.mjs --restore <id> ...
 *   add --dry to preview without writing.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ---- parse args ------------------------------------------------------------
const argv = process.argv.slice(2)
const DECISIONS = ['reject', 'snooze', 'restore']
let decision = null
let reason = null
let until = null
const dry = argv.includes('--dry')
const ids = []
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--dry') continue
  else if (a === '--reason') { reason = argv[++i]; }
  else if (a === '--until') { until = argv[++i]; }
  else if (a.startsWith('--') && DECISIONS.includes(a.slice(2))) { decision = a.slice(2) }
  else if (a.startsWith('--')) { console.error(`Unknown flag: ${a}`); process.exit(1) }
  else ids.push(a.trim())
}

if (!decision) { console.error('Need a decision flag: --reject | --snooze | --restore'); process.exit(1) }
if (!ids.length) { console.error('Need at least one intel id (full UUID or 8+ char prefix).'); process.exit(1) }
if (decision === 'snooze' && !/^\d{4}-\d{2}-\d{2}$/.test(until || '')) {
  console.error('--snooze requires --until YYYY-MM-DD'); process.exit(1)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ---- resolve ids (full or prefix) -----------------------------------------
const fullIds = ids.filter((x) => UUID_RE.test(x))
const prefixes = ids.filter((x) => !UUID_RE.test(x))
if (prefixes.some((p) => p.length < 8)) {
  console.error('Prefixes must be at least 8 chars to be safe. Offending: ' + prefixes.filter((p) => p.length < 8).join(', '))
  process.exit(1)
}

const resolved = new Map() // id -> headline
// Full ids: fetch to confirm they exist + get headlines.
if (fullIds.length) {
  const { data, error } = await db.from('intel_items').select('id, headline').in('id', fullIds)
  if (error) { console.error('lookup error: ' + error.message); process.exit(1) }
  for (const r of data ?? []) resolved.set(r.id, r.headline)
  const missing = fullIds.filter((x) => !resolved.has(x))
  if (missing.length) { console.error('No intel row for id(s): ' + missing.join(', ')); process.exit(1) }
}
// Prefixes: resolve via an exact server-side UUID range (not a client-side
// filter over a capped fetch — that silently missed items past Supabase's
// 1000-row default limit on busy days). A hex prefix maps to [lo..hi] UUIDs.
function prefixToRange(p) {
  const hex = p.toLowerCase().replace(/-/g, '')
  if (!/^[0-9a-f]+$/.test(hex) || hex.length > 32) return null
  const fmt = (h) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
  return [fmt(hex.padEnd(32, '0')), fmt(hex.padEnd(32, 'f'))]
}
for (const p of prefixes) {
  const range = prefixToRange(p)
  if (!range) { console.error(`Prefix "${p}" is not valid hex.`); process.exit(1) }
  const { data, error } = await db.from('intel_items').select('id, headline').gte('id', range[0]).lte('id', range[1])
  if (error) { console.error('prefix lookup error: ' + error.message); process.exit(1) }
  const hits = data ?? []
  if (hits.length === 0) { console.error(`No intel matches prefix "${p}".`); process.exit(1) }
  if (hits.length > 1) { console.error(`Prefix "${p}" is ambiguous (${hits.length} matches). Use a longer prefix or the full UUID.`); process.exit(1) }
  resolved.set(hits[0].id, hits[0].headline)
}

const targetIds = [...resolved.keys()]

// ---- build the update ------------------------------------------------------
const now = new Date().toISOString()
let update
if (decision === 'reject') update = { rejected_at: now, processed: true, rejected_reason: reason || 'morning triage (triage-apply)' }
else if (decision === 'snooze') update = { snoozed_until: until }
else if (decision === 'restore') update = { rejected_at: null, processed: false, rejected_reason: null, triage_decision: null, snoozed_until: null }

// ---- preview + apply -------------------------------------------------------
const verb = decision.toUpperCase()
console.log(`${dry ? '[DRY] ' : ''}${verb}${decision === 'snooze' ? ' until ' + until : ''} — ${targetIds.length} item(s):`)
for (const id of targetIds) console.log(`  • ${id.slice(0, 8)} · ${(resolved.get(id) || '').slice(0, 66)}`)

if (dry) { console.log('\n(dry run — nothing written)'); process.exit(0) }

const { error } = await db.from('intel_items').update(update).in('id', targetIds)
if (error) { console.error('\nWRITE ERROR: ' + error.message); process.exit(1) }
console.log(`\n✅ ${verb} applied to ${targetIds.length} item(s).`)
