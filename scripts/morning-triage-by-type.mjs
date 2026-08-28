#!/usr/bin/env node
/**
 * morning-triage-by-type — group the undecided intel queue BY TYPE, dedup it,
 * and flag which items we've ALREADY covered as a published alert.
 *
 * Why: the triage queue is a wall of 100s of items. Jill's insight (2026-08-28):
 * a sale / points-buy / bonus is NOT "just newsletter fodder" — each is an alert
 * candidate too. So the right unit of decision is a TYPE GROUP ("5 transfer
 * bonuses, here they are") not a keep/reject binary, and same-type items are
 * directly comparable. Scout already tags every item with `alert_type`, so the
 * grouping is free.
 *
 * The accuracy guard: every item is cross-checked against published + expired
 * alerts (program overlap + title-token match) and flagged COVERED vs NEW, so we
 * never re-recommend something already done. Deterministic (zero API) so it can
 * run every morning; borderline items default to NEW (Jill reviews) rather than
 * being hidden as covered.
 *
 * Usage:
 *   node scripts/morning-triage-by-type.mjs                # grouped summary + NEW items per type
 *   node scripts/morning-triage-by-type.mjs --type transfer_bonus   # drill into one type
 *   node scripts/morning-triage-by-type.mjs --covered      # also show COVERED matches (spot-check the guard)
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const now = new Date().toISOString()
const ARG_TYPE = (process.argv.find((a) => a.startsWith('--type=')) || '').split('=')[1]
  || (process.argv.includes('--type') ? process.argv[process.argv.indexOf('--type') + 1] : null)
const SHOW_COVERED = process.argv.includes('--covered')

// --- token helpers (shared by dedup + covered-check) -----------------------
const STOP = new Set(('the a an and or for to of on in with your you get now new best ever up as by is are add adds added ' +
  'through before after via more per off up to from at into out over under this that these those has have will can').split(' '))
const toks = (s) => [...new Set((s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter((w) => w.length > 3 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, '')))]
const jaccard = (a, b) => {
  if (!a.length || !b.length) return 0
  const B = new Set(b); let inter = 0
  for (const t of a) if (B.has(t)) inter++
  return inter / (a.length + b.length - inter)
}

// --- pull undecided active intel -------------------------------------------
const { data: intel } = await db.from('intel_items')
  .select('id, headline, alert_type, programs, created_at')
  .is('rejected_at', null).is('archived_at', null).is('alert_id', null).is('triage_decision', null)
  .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
  .or(`expires_at.is.null,expires_at.gte.${now}`)
  .order('created_at', { ascending: false }).limit(3000)

// --- pull published + expired alerts (title + programs) for the covered guard
const { data: pubRaw } = await db.from('content_variants')
  .select('title, topics(programs)')
  .eq('format', 'alert').in('status', ['published', 'expired'])
  .limit(2000)
const pub = (pubRaw || []).map((p) => ({ title: p.title, tokens: toks(p.title), programs: p.topics?.programs || [] }))

// covered = a published/expired alert shares a program AND enough title tokens.
function coveredBy(item) {
  const it = toks(item.headline)
  const iprog = Array.isArray(item.programs) ? item.programs : []
  for (const p of pub) {
    const progOverlap = iprog.some((x) => p.programs.includes(x)) ||
      iprog.some((x) => p.tokens.includes(x.replace(/-/g, ' ').split(' ')[0]))
    if (!progOverlap && iprog.length) continue
    if (jaccard(it, p.tokens) >= 0.42) return p.title
  }
  return null
}

// --- dedup within the undecided set (fuzzy signature) ----------------------
// Reworded re-forwards of the same offer share: primary program + alert_type +
// the headline number (e.g. "15%", "100k", "$250"). Keying on those collapses
// "Cap One to Avianca 15% conversion bonus" / "...15% bonus transferring" into
// one. Numberless items fall back to their top content tokens.
const sigOf = (r) => {
  const prog = (Array.isArray(r.programs) ? r.programs : []).slice().sort()[0] || ''
  const t = r.alert_type || ''
  const num = (r.headline || '').toLowerCase().replace(/,/g, '').match(/\b(\d+(?:\.\d+)?)\s*(%|k\b|,000|percent|miles|points|nights?|\$)/)
  const key = num ? `${num[1]}${num[2].replace(/[^a-z%$]/g, '')}` : toks(r.headline).sort().slice(0, 3).join('.')
  return `${prog}|${t}|${key}`
}
const seen = new Map()
for (const r of intel || []) {
  const s = sigOf(r)
  if (!seen.has(s)) seen.set(s, { ...r, dupes: 1 })
  else seen.get(s).dupes++
}
const uniq = [...seen.values()]

// --- classify covered/new, group by type -----------------------------------
const groups = new Map()
let totalNew = 0, totalCovered = 0, totalDupes = (intel || []).length - uniq.length
for (const r of uniq) {
  const cov = coveredBy(r)
  if (cov) totalCovered++; else totalNew++
  const t = r.alert_type || 'untyped'
  if (!groups.has(t)) groups.set(t, { new: [], covered: [] })
  groups.get(t)[cov ? 'covered' : 'new'].push({ ...r, coveredBy: cov })
}
const ordered = [...groups.entries()].sort((a, b) => (b[1].new.length + b[1].covered.length) - (a[1].new.length + a[1].covered.length))

// --- render -----------------------------------------------------------------
const B = '─'.repeat(70)
console.log(B)
console.log(`INTEL TO TRIAGE — by type  (${(intel || []).length} undecided → ${uniq.length} unique after ${totalDupes} near-dupes)`)
console.log(`  ${totalNew} NEW · ${totalCovered} already covered by a published alert`)
console.log(B)
for (const [type, g] of ordered) {
  if (ARG_TYPE && type !== ARG_TYPE) continue
  const label = type.replace(/_/g, ' ')
  console.log(`\n### ${label.toUpperCase()} — ${g.new.length} new${g.covered.length ? ` · ${g.covered.length} covered` : ''}`)
  for (const r of g.new.slice(0, ARG_TYPE ? 100 : 12)) {
    const progs = (Array.isArray(r.programs) ? r.programs : []).slice(0, 3).join(',')
    console.log(`  🆕 [${progs || '—'}] ${(r.headline || '').slice(0, 74)}${r.dupes > 1 ? `  (×${r.dupes})` : ''}`)
  }
  if (!ARG_TYPE && g.new.length > 12) console.log(`     …+${g.new.length - 12} more new (drill: --type ${type})`)
  if (SHOW_COVERED) for (const r of g.covered.slice(0, 20)) {
    console.log(`  ✓ [covered] ${(r.headline || '').slice(0, 50)}  ⇐ ${r.coveredBy.slice(0, 42)}`)
  }
}
console.log('\n' + B)
console.log('Walk one type-group at a time; decide the NEW items. COVERED are auto-hidden (--covered to audit).')
