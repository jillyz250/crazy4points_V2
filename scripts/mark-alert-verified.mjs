#!/usr/bin/env node
/**
 * mark-alert-verified — stamp last_verified on a published alert so it clears the
 * admin_refresh_queue (Phase 8 of the daily ritual).
 *
 * WHY: the refresh queue reads alerts.last_verified, but alerts is a MIRROR and
 * direct writes are blocked by the G6 trigger. The sanctioned path (see migration
 * 609) is to set last_verified in the alert's content_variant metadata; the
 * variants->alerts trigger then mirrors it to alerts.last_verified. This helper
 * does exactly that, matching by short_slug.
 *
 * Usage:
 *   node scripts/mark-alert-verified.mjs <short-slug> [<short-slug> ...]
 *   add --dry to preview.
 *
 * Only stamp an alert you actually re-verified against an official source today.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const dry = process.argv.includes('--dry')
const slugs = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!slugs.length) { console.error('Need at least one alert short_slug.'); process.exit(1) }

const today = new Date().toISOString().slice(0, 10)
let ok = 0
for (const slug of slugs) {
  // short_slug lives in metadata->>short_slug (the column is usually null).
  const { data: cvs, error } = await db.from('content_variants')
    .select('id, short_slug, status, metadata')
    .eq('format', 'alert').eq('metadata->>short_slug', slug)
    .in('status', ['published', 'expired'])
  if (error) { console.error(`  ${slug}: lookup error ${error.message}`); continue }
  if (!cvs?.length) { console.error(`  ${slug}: no published/expired alert variant found`); continue }
  for (const cv of cvs) {
    const meta = { ...(cv.metadata || {}), last_verified: today }
    if (dry) { console.log(`  [DRY] ${slug} (variant ${cv.id.slice(0, 8)}) -> last_verified=${today}`); ok++; continue }
    const { error: e2 } = await db.from('content_variants').update({ metadata: meta }).eq('id', cv.id)
    if (e2) { console.error(`  ${slug}: write error ${e2.message}`); continue }
    console.log(`  ${slug} (variant ${cv.id.slice(0, 8)}) -> last_verified=${today}`)
    ok++
  }
}
// Confirm the mirror caught up (best-effort read).
if (!dry) {
  const { data: check } = await db.from('alerts').select('short_slug, last_verified').in('short_slug', slugs)
  for (const a of check || []) console.log(`  mirror: ${a.short_slug} alerts.last_verified=${a.last_verified || 'still null (trigger may lag)'}`)
}
console.log(`\n${dry ? '[DRY] ' : ''}stamped ${ok} variant(s).`)
