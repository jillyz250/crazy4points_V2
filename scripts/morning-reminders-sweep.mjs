#!/usr/bin/env node
/**
 * morning-reminders-sweep — auto-complete reminders whose window has passed, so
 * the morning ritual isn't buried under a graveyard of dead "post before it ends"
 * and "bidding closes" reminders. (Reminders were never auto-expired; by the 1st
 * of a month ~30+ stale ones piled up.)
 *
 * What it completes (status -> 'done'), only when due_date is already PAST:
 *   - "Bidding closes …" / kind=experience / auction links  -> the auction closed
 *   - "… before it ends" reminders whose tied alert is NO LONGER live (the deal
 *     ended). SAFETY: if the tied alert is still published with a future end_date,
 *     the reminder is KEPT — the deal is on, you can still post.
 * What it KEEPS (never auto-completes):
 *   - Evergreen "Social post: …" (no "before it ends") — still postable
 *   - Any other real to-do the user set (e.g. a program-facts re-run)
 *
 * Flag-only by default (reports, changes nothing). Pass --apply to complete them.
 * Honors MORNING_DATE=YYYY-MM-DD for dry-runs; real cleanup uses the real date.
 *
 * Run:  node scripts/morning-reminders-sweep.mjs            # preview
 *       node scripts/morning-reminders-sweep.mjs --apply    # complete them
 * Runs in Step 0b of the daily ritual, right after morning-dedup.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const APPLY = process.argv.includes('--apply')
const nowIso = new Date().toISOString()
const todayET = (process.env.MORNING_DATE || new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })).trim()

const isAuction = (r) => r.kind === 'experience' || /bidding closes/i.test(r.title || '') || /auction/i.test(r.link || '')
const isBeforeEnds = (r) => /before it ends/i.test(r.title || '')
const slugOf = (link) => { const m = /\/alerts\/([^/?#]+)/.exec(link || ''); return m ? m[1] : null }

const { data: open } = await db.from('reminders').select('id, title, due_date, link, kind').eq('status', 'open')
const past = (open || []).filter((r) => r.due_date && r.due_date < todayET)

// Slugs of alerts still live (published + future end_date) — their "before it
// ends" reminders must NOT be swept even if the reminder's own date slipped past.
const { data: liveAlerts } = await db.from('alerts').select('short_slug, slug, end_date')
  .eq('status', 'published').not('end_date', 'is', null).gte('end_date', nowIso)
const liveSlugs = new Set()
for (const a of liveAlerts || []) { if (a.short_slug) liveSlugs.add(a.short_slug); if (a.slug) liveSlugs.add(a.slug) }

const toComplete = []
let kept = 0
for (const r of past) {
  if (isAuction(r)) { toComplete.push([r, 'auction closed']); continue }
  if (isBeforeEnds(r)) {
    const s = slugOf(r.link)
    if (s && liveSlugs.has(s)) { kept++; continue }       // deal still live — keep
    toComplete.push([r, 'deal ended']); continue
  }
  kept++ // evergreen "Social post:" / real to-do — keep
}

console.log(`reminders-sweep${APPLY ? ' [APPLY]' : ' [preview]'} (as of ${todayET}): ${toComplete.length} to complete, ${kept} kept, of ${past.length} past-due open.`)
for (const [r, why] of toComplete) console.log(`  ${APPLY ? 'DONE' : 'would complete'}: [${r.due_date}] ${(r.title || '').slice(0, 58)}  (${why})`)
if (APPLY && toComplete.length) {
  const ids = toComplete.map(([r]) => r.id)
  const { error } = await db.from('reminders').update({ status: 'done', completed_at: nowIso }).in('id', ids)
  console.log(error ? `ERR ${error.message}` : `\ncompleted ${ids.length} reminder(s).`)
}
