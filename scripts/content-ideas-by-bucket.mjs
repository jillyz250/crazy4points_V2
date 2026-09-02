#!/usr/bin/env node
/**
 * content-ideas-by-bucket — drain the roadmap idea backlog one PILLAR at a time
 * (Jill, 2026-09-02), the way morning-triage-by-type drains intel. The nightly
 * auto-clear already removes covered/stale/dupes; this walks the survivors grouped
 * by pillar so you promote the keepers and dismiss the rest a bucket at a time.
 * NOTE: the column is `roadmap_pillar`, not `pillar` (silent-column trap).
 *
 * Usage:
 *   node scripts/content-ideas-by-bucket.mjs                 # grouped overview
 *   node scripts/content-ideas-by-bucket.mjs --pillar trips  # drill one pillar (ids)
 *   node scripts/content-ideas-by-bucket.mjs --dismiss <8charIds...>   # not worth it
 *   node scripts/content-ideas-by-bucket.mjs --promote <8charIds...>   # vetted -> roadmap_reviewed
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
const flagVals = (f) => { const i = args.indexOf(f); return i < 0 ? [] : args.slice(i + 1).filter((a) => !a.startsWith('--')) }

const STOP = new Set('the a an and or for to of on in with your you get now new best ever how what which why guide points miles card cards this that'.split(' '))
const toks = (s) => [...new Set((s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, '')))]
const jac = (a, b) => { if (!a.length || !b.length) return 0; const B = new Set(b); let i = 0; for (const t of a) if (B.has(t)) i++; return i / (a.length + b.length - i) }

async function updateByPrefix(ids, patch, label) {
  const { data } = await db.from('content_ideas').select('id').in('status', ['new', 'idea_bank'])
  const map = new Map((data || []).map((r) => [r.id.slice(0, 8), r.id]))
  const full = ids.map((p) => map.get(p)).filter(Boolean)
  if (!full.length) { console.log('no matching ideas for those ids'); return }
  for (let i = 0; i < full.length; i += 100) await db.from('content_ideas').update(patch).in('id', full.slice(i, i + 100))
  console.log(`${label} ${full.length} idea(s).`)
}

if (args.includes('--dismiss')) { await updateByPrefix(flagVals('--dismiss'), { status: 'dismissed' }, 'dismissed'); process.exit(0) }
if (args.includes('--promote')) { await updateByPrefix(flagVals('--promote'), { roadmap_reviewed: true }, 'promoted (roadmap_reviewed)'); process.exit(0) }

const drill = (() => { const i = args.indexOf('--pillar'); return i >= 0 ? args[i + 1] : null })()

const { data: ideas } = await db.from('content_ideas')
  .select('id, title, roadmap_pillar, suggested_pillar, created_at').in('status', ['new', 'idea_bank']).limit(5000)
const groups = new Map()
for (const r of ideas || []) {
  const p = r.roadmap_pillar || r.suggested_pillar || 'unsorted'
  if (!groups.has(p)) groups.set(p, [])
  groups.get(p).push(r)
}
const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)

if (drill) {
  const rows = groups.get(drill) || []
  console.log(`PILLAR "${drill}" — ${rows.length} idea(s):\n`)
  const kept = []
  for (const r of rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))) {
    if (kept.some((k) => jac(toks(r.title), k) >= 0.6)) continue // collapse near-dupes in the view
    kept.push(toks(r.title))
    console.log(`  ${r.id.slice(0, 8)}  ${(r.title || '').slice(0, 68)}`)
  }
  console.log(`\n-> promote keepers: --promote <ids> · dismiss rest: --dismiss <ids>`)
} else {
  console.log(`CONTENT IDEAS BACKLOG — ${ideas?.length || 0} unwritten, by pillar:\n`)
  for (const [p, rows] of ordered) console.log(`  ${String(p).padEnd(14)} ${rows.length}`)
  console.log(`\n-> drill one: --pillar <name>  (walk it, then --promote / --dismiss the ids)`)
}
