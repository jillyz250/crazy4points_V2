/**
 * check-coverage — "is this already handled?" in ONE thorough command.
 *
 * Built 2026-09-04 after a narrow keyword grep gave a false "not covered" on the
 * Chase->Hyatt 4:3 change (it was on the page + a reminder). Before EVER claiming
 * something is a gap / stale / uncovered, run this: it full-text searches every
 * surface where coverage can live, so the answer is reliable and falsifiable.
 *
 * Usage:  node scripts/check-coverage.mjs "hyatt" "4:3"        (any term matches)
 *         node scripts/check-coverage.mjs "flying blue" devaluation
 *
 * Prints matches per surface: program prose (quirks/sweet_spots/intro), reminders,
 * published + draft alerts, change-signals, and the sweet_spots table.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) { const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const terms = process.argv.slice(2).map((t) => t.toLowerCase())
if (terms.length === 0) { console.log('usage: node scripts/check-coverage.mjs "term1" "term2" ...'); process.exit(1) }
const hit = (s) => { const t = (s || '').toLowerCase(); return terms.some((k) => t.includes(k)) }
const clip = (s, n = 150) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n)

console.log(`\n🔎 Coverage check for: ${terms.map((t) => `"${t}"`).join(' OR ')}\n`)
let total = 0

// 1. Program prose
{
  const { data } = await db.from('programs').select('slug, quirks, sweet_spots, intro')
  const rows = (data || []).filter((p) => hit(p.quirks) || hit(p.sweet_spots) || hit(p.intro))
  console.log(`PROGRAM PAGES (prose): ${rows.length}`)
  for (const p of rows) {
    const field = hit(p.quirks) ? 'quirks' : hit(p.sweet_spots) ? 'sweet_spots' : 'intro'
    const seg = (p[field] || '').split(/(?<=[.!?])\s+|\n/).find(hit)
    console.log(`  • ${p.slug} [${field}]: ${clip(seg)}`)
  }
  total += rows.length
}
// 2. Reminders
{
  const { data } = await db.from('reminders').select('title, notes, status')
  const rows = (data || []).filter((r) => hit(r.title) || hit(r.notes))
  console.log(`\nREMINDERS: ${rows.length}`)
  for (const r of rows) console.log(`  • [${r.status}] ${clip(r.title, 90)}`)
  total += rows.length
}
// 3. Alerts (published/expired mirror)
{
  const { data } = await db.from('alerts').select('slug, title, status')
  const rows = (data || []).filter((a) => hit(a.title))
  console.log(`\nALERTS: ${rows.length}`)
  for (const a of rows) console.log(`  • [${a.status}] ${clip(a.title, 90)}`)
  total += rows.length
}
// 4. Draft alerts (content_variants)
{
  const { data } = await db.from('content_variants').select('short_slug, title, status').eq('format', 'alert')
  const rows = (data || []).filter((v) => hit(v.title))
  console.log(`\nDRAFT/VARIANT ALERTS: ${rows.length}`)
  for (const v of rows) console.log(`  • [${v.status}] ${clip(v.title, 90)}`)
  total += rows.length
}
// 5. Change-signals
{
  const { data } = await db.from('change_signals').select('program_slug, signal_type, summary, status')
  const rows = (data || []).filter((s) => hit(s.summary) || hit(s.program_slug))
  console.log(`\nCHANGE-SIGNALS: ${rows.length}`)
  for (const s of rows) console.log(`  • [${s.status}|${s.signal_type}|${s.program_slug}] ${clip(s.summary, 80)}`)
  total += rows.length
}
// 6. Sweet_spots table
{
  const { data } = await db.from('sweet_spots').select('program_slug, title, status')
  const rows = (data || []).filter((s) => hit(s.title) || hit(s.program_slug))
  console.log(`\nSWEET_SPOTS table: ${rows.length}`)
  for (const s of rows) console.log(`  • [${s.status}|${s.program_slug}] ${clip(s.title, 80)}`)
  total += rows.length
}

console.log(`\n${total === 0 ? '❌ NO coverage found across any surface — likely a real gap.' : `✅ ${total} match(es) — it IS covered somewhere; read the lines above before calling it a gap.`}\n`)
