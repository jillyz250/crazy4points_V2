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

export type ProgramRecheckSummary = { checked: number; moved: number; ok: number; broken: number; brokenList: string[] }

/**
 * Health-check program `reverify_source_url`s (Jill, 2026-09-05) — these weren't
 * monitored (only the sources table was). Redirects get updated; a truly-dead one
 * (404/410/gone) is CLEARED and its old URL preserved in the label, so it drops
 * back into the coverage drive (aging `programs_no_source`) for a fresh hunt.
 * 403/blocked and feeds are left (valid). Rotates oldest-verified-first.
 */
export async function recheckProgramSources(
  db: SupabaseClient,
  { limit = 30, apply = true, timeoutMs = 6000 }: { limit?: number; apply?: boolean; timeoutMs?: number } = {},
): Promise<ProgramRecheckSummary> {
  const { data } = await db.from('programs')
    .select('slug,name,reverify_source_url,reverify_source_label,reverified_at')
  type P = { slug: string; name: string | null; reverify_source_url: string | null; reverify_source_label: string | null; reverified_at: string | null }
  const withUrl = (data as P[] ?? []).filter((p) => p.reverify_source_url)
  withUrl.sort((a, b) => (ageDays(a.reverified_at) ?? 9999) - (ageDays(b.reverified_at) ?? 9999) === 0 ? 0 : (ageDays(b.reverified_at) ?? 9999) - (ageDays(a.reverified_at) ?? 9999))
  const batch = withUrl.slice(0, limit)
  const r: ProgramRecheckSummary = { checked: batch.length, moved: 0, ok: 0, broken: 0, brokenList: [] }
  const today = new Date().toISOString().slice(0, 10)
  for (const p of batch) {
    const res = await probe(p.reverify_source_url as string, timeoutMs)
    if ([301, 302, 307, 308].includes(res.status) && res.location) {
      const nu = res.location.startsWith('http') ? res.location : new URL(res.location, p.reverify_source_url as string).href
      if (apply) await db.from('programs').update({ reverify_source_url: nu, reverified_at: new Date().toISOString() }).eq('slug', p.slug); r.moved++
    } else if (res.status >= 200 && res.status < 400 || [403, 405, 429, 406].includes(res.status)) {
      r.ok++ // 2xx/3xx ok, or blocked-but-valid
    } else {
      // 404 / gone / error -> clear it back into the coverage drive, keep old URL in label
      if (apply) await db.from('programs').update({
        reverify_source_url: null,
        reverify_source_label: `[was ${p.reverify_source_url} — ${res.status || 'error'} ${today}, re-hunt]`.slice(0, 300),
      }).eq('slug', p.slug)
      r.broken++; r.brokenList.push(`${p.name} (${res.status || 'error'})`)
    }
  }
  return r
}
