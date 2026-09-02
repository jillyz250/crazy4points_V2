#!/usr/bin/env node
/**
 * chain-sweep — make the ritual Phase 14 perk-chain sweep DETERMINISTIC instead of
 * eyeballed (Jill, 2026-09-02). Looks at recently-touched program pages and flags any
 * whose PROSE describes a chain-worthy mechanic (status match, cross-program transfer,
 * a status/benefit that unlocks another) but which has NO entry in lib/perkChains.ts.
 * Those are chains living only as prose that should be promoted into the chain system.
 *
 * Usage:
 *   node scripts/chain-sweep.mjs            # programs touched today
 *   node scripts/chain-sweep.mjs --days 7   # touched in the last 7 days
 *   node scripts/chain-sweep.mjs --all      # scan every program (full audit)
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const args = process.argv.slice(2)
const days = (() => { const i = args.indexOf('--days'); return i >= 0 ? Number(args[i + 1]) : (args.includes('--all') ? null : 1) })()

// Slugs already represented in the chain map — parsed from the source (a .mjs can't import .ts).
const src = fs.readFileSync('lib/perkChains.ts', 'utf8')
const covered = new Set()
for (const m of src.matchAll(/programSlugs:\s*\[([^\]]*)\]/g)) {
  for (const s of m[1].matchAll(/'([^']+)'/g)) covered.add(s[1])
}

// Prose that signals "one thing unlocks another" — the essence of a chain.
const SIGNALS = [
  /status[\s-]?match/i, /matches? into/i, /reciprocal/i,
  /transfer(?:s|red)? (?:to|into|between)/i, /two[\s-]?way (?:point )?transfer/i,
  /unlocks?\b/i, /complimentary [A-Z][a-z]+ (?:Gold|Platinum|Diamond|status)/i,
]

let query = db.from('programs').select('slug, name, quirks, sweet_spots, intro, content_updated_at')
if (days !== null) query = query.gte('content_updated_at', new Date(Date.now() - days * 864e5).toISOString())
const { data: progs, error } = await query.limit(2000)
if (error) { console.log('!! QUERY PROBLEM:', error.message); process.exit(1) }

// A negated line ("no transfer partners", "does not transfer") is the OPPOSITE of a
// chain — don't let it trip the signal.
const NEGATED = /\b(no|not|n't|cannot|can't|do(es)? not|don't|doesn't|without|excluded|no major|there is no)\b/i
const flags = []
for (const p of progs || []) {
  if (covered.has(p.slug)) continue // already in the chain map
  const prose = [p.quirks, p.sweet_spots, p.intro].filter(Boolean).join('\n')
  const chainLines = prose.split('\n').filter((l) => SIGNALS.some((re) => re.test(l)) && !NEGATED.test(l))
  if (chainLines.length) {
    flags.push({ slug: p.slug, name: p.name, hits: chainLines.length, evidence: chainLines[0].trim().slice(0, 140) })
  }
}
flags.sort((a, b) => b.hits - a.hits)

const scope = days === null ? 'ALL programs' : days === 1 ? 'programs touched today' : `programs touched in last ${days}d`
console.log(`CHAIN SWEEP — ${scope}: ${progs?.length || 0} scanned, ${covered.size} already in the chain map.\n`)
if (!flags.length) { console.log('✓ No chain-worthy prose missing from lib/perkChains.ts.'); process.exit(0) }
console.log(`${flags.length} program(s) describe a chain in PROSE but have NO perkChains.ts entry:\n`)
for (const f of flags) console.log(`  ⚠ ${f.slug.padEnd(22)} (${f.hits} signal${f.hits > 1 ? 's' : ''})\n      "${f.evidence}..."`)
console.log(`\n-> Promote the real ones into lib/perkChains.ts (verify vs official first, keep qualitative).`)
