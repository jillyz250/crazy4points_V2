#!/usr/bin/env node
/**
 * sweet-spot-history — the last 10 Sweet Spots from SENT newsletters, with dates.
 *
 * Standard practice before picking a newsletter Sweet Spot (Jill, 2026-08-28):
 * run this, show Jill the list, and pick a program/topic that is NOT on it so
 * the sweet spot feels fresh every issue. Only SENT newsletters count (drafts
 * that never went out don't "use up" a sweet spot).
 *
 *   node scripts/sweet-spot-history.mjs
 */
import { db, must } from './lib/db.mjs'

const rows = await must(
  db
    .from('newsletters')
    .select('week_of, sent_at, sweet_spot')
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(10),
)

console.log('\nLast 10 Sweet Spots used (SENT newsletters only):\n')
if (!rows.length) {
  console.log('  (none sent yet)')
} else {
  for (const n of rows) {
    const date = (n.sent_at || n.week_of || '').slice(0, 10)
    const topic = n.sweet_spot?.topic || '(no sweet spot)'
    console.log(`  ${date}   ${topic}`)
  }
}
console.log('\nPick a program/topic NOT on this list.\n')
process.exit(0)
