/**
 * recheckSources — source-health "find + fix" core (Jill, 2026-09-05).
 *
 * Shared by the weekly cron (/api/cron/recheck-sources) and the CLI helper.
 * HTTP-probes quiet/stale ACTIVE sources and applies the SAFE mechanical fixes:
 *   • 301/302/307/308 redirect  -> update url to the new location (+ Firecrawl)
 *   • 200 HTML page             -> switch to Firecrawl (RSS-style scrape gets nothing)
 *   • 200 real RSS/XML          -> leave (feed works; 0 items = genuinely quiet)
 *   • 403/405/429/406 blocked   -> Firecrawl (real browser gets past anti-bot)
 *   • 404/410/gone/error        -> flag NEEDS URL FIX (a human hunts the new URL)
 * Never auto-retires — retiring loses coverage; we fix or flag. The flagged ones
 * escalate in the aging monitor (sources_recheck) so they can't rot.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

type Src = {
  id: string; name: string | null; url: string | null; is_active: boolean
  use_firecrawl: boolean | null; items_produced: number | null
  last_scraped_at: string | null; created_at: string | null
}

const ageDays = (d: string | null | undefined) => (d ? Math.floor((Date.now() - Date.parse(d)) / 864e5) : null)
const isFeed = (ct: string) => /xml|rss|atom/i.test(ct)

async function probe(u: string, timeoutMs = 6000) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(u, { redirect: 'manual', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 (crazy4points source-recheck)' } })
    clearTimeout(t)
    return { status: res.status, location: res.headers.get('location'), contentType: res.headers.get('content-type') || '' }
  } catch { return { status: 0, location: null, contentType: '' } }
}

export type RecheckSummary = {
  checked: number; moved: number; firecrawl: number; feedOk: number; alreadyFc: number
  needsFix: number; needsFixList: string[]
}

export async function recheckSources(
  db: SupabaseClient,
  { limit = 40, apply = true, timeoutMs = 6000 }: { limit?: number; apply?: boolean; timeoutMs?: number } = {},
): Promise<RecheckSummary> {
  const { data } = await db.from('sources')
    .select('id,name,url,is_active,use_firecrawl,items_produced,last_scraped_at,created_at')
  const quiet = (data as Src[] ?? []).filter((s) => s.is_active && s.url && (
    (((s.items_produced ?? 0) === 0) && (ageDays(s.created_at) ?? 0) > 30) || (ageDays(s.last_scraped_at) ?? 999) > 14
  ))
  // Prioritise the least-recently-touched (rotate coverage across weekly runs).
  quiet.sort((a, b) => (ageDays(b.last_scraped_at) ?? 9999) - (ageDays(a.last_scraped_at) ?? 9999))
  const batch = quiet.slice(0, limit)

  const s: RecheckSummary = { checked: batch.length, moved: 0, firecrawl: 0, feedOk: 0, alreadyFc: 0, needsFix: 0, needsFixList: [] }
  for (const src of batch) {
    const r = await probe(src.url as string, timeoutMs)
    let patch: Record<string, unknown> | null = null
    if ([301, 302, 307, 308].includes(r.status) && r.location) {
      const newUrl = r.location.startsWith('http') ? r.location : new URL(r.location, src.url as string).href
      patch = { url: newUrl, use_firecrawl: true, notes: `auto-recheck: ${r.status} moved -> updated URL, Firecrawl` }; s.moved++
    } else if (r.status === 200 && !isFeed(r.contentType)) {
      if (src.use_firecrawl) s.alreadyFc++
      else { patch = { use_firecrawl: true, notes: 'auto-recheck: HTML page (not RSS) -> Firecrawl' }; s.firecrawl++ }
    } else if (r.status === 200 && isFeed(r.contentType)) {
      s.feedOk++
    } else if ([403, 405, 429, 406].includes(r.status)) {
      if (src.use_firecrawl) s.alreadyFc++
      else { patch = { use_firecrawl: true, notes: `auto-recheck: blocked (${r.status}) -> Firecrawl (real browser gets past anti-bot)` }; s.firecrawl++ }
    } else {
      patch = { notes: `NEEDS URL FIX — auto-recheck ${r.status || 'error'}` }; s.needsFix++
      s.needsFixList.push(`${src.name} (${r.status || 'error'})`)
    }
    if (apply && patch) await db.from('sources').update(patch).eq('id', src.id)
  }
  return s
}
