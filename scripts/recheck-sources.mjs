#!/usr/bin/env node
/**
 * recheck-sources — the source-health "find + fix" helper (Jill, 2026-09-05).
 *
 * An ACTIVE source that produces nothing is false coverage — the URL likely
 * changed/broke. This rechecks every quiet/stale active source, HTTP-tests it,
 * and applies the SAFE mechanical fixes automatically:
 *   • 301/302 redirect  -> update url to the new location (+ Firecrawl), keep active
 *   • 200 HTML page      -> switch to Firecrawl (RSS-style scrape gets nothing), keep active
 *   • 200 real RSS/XML   -> leave as-is (feed works; 0 items = genuinely quiet)
 *   • 404 / 410 / 403 / error -> FLAG "NEEDS URL FIX (status)" in notes; keep active so
 *                                the aging monitor keeps nagging until a human finds the URL
 * Prints a summary + the NEEDS-URL-FIX shortlist (those need a web search for the new URL).
 *
 * Never retires a source automatically — retiring loses coverage; we fix or flag.
 * Usage:  node scripts/recheck-sources.mjs [--limit N] [--apply]   (default: dry-run)
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

// env from .env.local
const env = Object.fromEntries(
  (fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '')
    .split('\n').filter((l) => l.includes('=')).map((l) => {
      const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
const db = createClient(url, key)

const APPLY = process.argv.includes('--apply')
const limArg = process.argv.indexOf('--limit')
const LIMIT = limArg > -1 ? parseInt(process.argv[limArg + 1], 10) : 999

const ageDays = (d) => (d ? Math.floor((Date.now() - Date.parse(d)) / 864e5) : null)

async function probe(u) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(u, { redirect: 'manual', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 (crazy4points source-recheck)' } })
    clearTimeout(t)
    const loc = res.headers.get('location')
    const ct = res.headers.get('content-type') || ''
    return { status: res.status, location: loc, contentType: ct }
  } catch (e) { return { status: 0, error: String(e).slice(0, 60) } }
}

const isFeed = (ct) => /xml|rss|atom/i.test(ct)

;(async () => {
  const { data: all } = await db.from('sources').select('id,name,url,type,is_active,use_firecrawl,items_produced,last_scraped_at,created_at')
  const quiet = (all ?? []).filter((s) => s.is_active && (((s.items_produced ?? 0) === 0 && (ageDays(s.created_at) ?? 0) > 30) || (ageDays(s.last_scraped_at) ?? 999) > 14))
  const batch = quiet.slice(0, LIMIT)
  console.log(`quiet/stale active sources: ${quiet.length}; checking ${batch.length} (${APPLY ? 'APPLY' : 'dry-run'})\n`)
  const out = { moved: 0, firecrawl: 0, feedOk: 0, needsFix: 0, alreadyFc: 0 }
  const needsFix = []
  for (const s of batch) {
    const r = await probe(s.url)
    let verdict = '', patch = null
    if ((r.status === 301 || r.status === 302 || r.status === 308) && r.location) {
      const newUrl = r.location.startsWith('http') ? r.location : new URL(r.location, s.url).href
      verdict = `MOVED -> ${newUrl}`; patch = { url: newUrl, use_firecrawl: true, notes: `recheck 2026-09-05: ${r.status} moved -> updated URL, Firecrawl on` }; out.moved++
    } else if (r.status === 200 && !isFeed(r.contentType)) {
      if (s.use_firecrawl) { verdict = 'HTML, already Firecrawl (0 items = check parse/quiet)'; out.alreadyFc++ }
      else { verdict = 'HTML page -> Firecrawl'; patch = { use_firecrawl: true, notes: 'recheck 2026-09-05: HTML page (not RSS) -> switched to Firecrawl' }; out.firecrawl++ }
    } else if (r.status === 200 && isFeed(r.contentType)) {
      verdict = 'RSS ok (0 items = genuinely quiet)'; out.feedOk++
    } else if (r.status === 403 || r.status === 405 || r.status === 429 || r.status === 406) {
      // BLOCKED, not dead — anti-bot rejects a bare fetch; Firecrawl's real browser gets past it.
      if (s.use_firecrawl) { verdict = `blocked (${r.status}) but already Firecrawl — verify parse`; out.alreadyFc++ }
      else { verdict = `BLOCKED (${r.status}) -> Firecrawl`; patch = { use_firecrawl: true, notes: `recheck 2026-09-05: bare-fetch blocked (${r.status}); switched to Firecrawl (real browser gets past anti-bot)` }; out.firecrawl++ }
    } else {
      verdict = `NEEDS URL FIX (${r.status || r.error})`; patch = { notes: `recheck 2026-09-05: NEEDS URL FIX — ${r.status || r.error}` }; out.needsFix++
      needsFix.push(`${s.name} — ${s.url} — ${r.status || r.error}`)
    }
    if (APPLY && patch) await db.from('sources').update(patch).eq('id', s.id)
    console.log(`  ${verdict}  ·  ${s.name}`)
  }
  console.log(`\nSUMMARY: moved=${out.moved} html->firecrawl=${out.firecrawl} feed-ok=${out.feedOk} already-fc=${out.alreadyFc} NEEDS-URL-FIX=${out.needsFix}`)
  if (needsFix.length) { console.log('\n=== NEEDS URL FIX (search for new URL) ==='); needsFix.forEach((n) => console.log('  ' + n)) }
})()
