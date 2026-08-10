/**
 * runSweepstakesWatch — daily monitor for points/miles sweepstakes.
 *
 * For each active row in `sweepstakes_sources`: scrape the page (Firecrawl),
 * extract the currently-running sweepstakes/giveaways (Haiku), upsert them into
 * `sweepstakes` (dedup on program+title, refresh last_seen), and mark ones that
 * vanished from a successfully-scraped source as ended.
 *
 * Each running sweepstakes is a Facebook-post candidate — the Wyndham giveaway
 * was crazy4points' best post ever (point an ad at a c4p landing page with
 * "register at crazy4points.com"). The admin dashboard surfaces the count + a
 * "needs a social post" flag; posting is a human step (facebook-post skill).
 *
 * Facts only — we extract structured data, never republish source copy/images.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/utils/ai/logUsage'

export interface SweepstakesSource {
  id: string
  program: string
  url: string
  // 'program' = a single program's own page (program label comes from the source).
  // 'aggregator' = a sweepstakes-directory page listing many programs' sweeps; we
  // extract each sweep's OWN program and keep only loyalty-program-run ones.
  kind: 'program' | 'aggregator'
}

export interface ParsedSweep {
  title: string
  prize: string | null
  entry_url: string | null
  mechanic: 'one_time' | 'daily_entry' | 'unknown'
  ends_at: string | null // ISO YYYY-MM-DD
  // Only set for aggregator sources: the loyalty program running the sweep.
  program: string | null
}

export interface WatchResult {
  sourcesChecked: number
  sourcesScraped: number
  running: number
  newlyFound: string[]
  ended: number
  expired: number
  deadLinks: number
  errors: { program: string; error: string }[]
}

// A link is "dead" only on hard failures — 404/410, a 5xx, or a network error.
// 401/403 are treated as alive: sites like aa.com bot-block with 403 but are
// genuinely live, and we must never end a real sweep over a bot wall.
async function linkStatus(url: string): Promise<number> {
  try {
    const r = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    return r.status
  } catch {
    return 0
  }
}
const isDeadStatus = (s: number) => s === 0 || s === 404 || s === 410 || s >= 500

async function firecrawlMarkdown(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY
  if (!key) return ''
  try {
    const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], waitFor: 5000 }),
      signal: AbortSignal.timeout(70_000),
    })
    const json = await res.json()
    return (json?.data?.markdown as string) ?? ''
  } catch {
    return ''
  }
}

// Loyalty programs whose OWN sweepstakes we care about on an aggregator page.
// Used only to steer the aggregator prompt — the model still returns the program.
const LOYALTY_PROGRAMS =
  'Marriott Bonvoy, Hilton Honors, IHG One Rewards, World of Hyatt, Wyndham Rewards, ' +
  'Choice Privileges, Best Western Rewards, Radisson Rewards, Delta SkyMiles, United MileagePlus, ' +
  'American AAdvantage, Southwest Rapid Rewards, JetBlue TrueBlue, Alaska Mileage Plan, ' +
  'Frontier Miles, Air Canada Aeroplan'

async function extractSweepstakes(
  anthropic: Anthropic,
  source: SweepstakesSource,
  md: string,
): Promise<ParsedSweep[]> {
  const today = new Date().toISOString().slice(0, 10)
  const isAgg = source.kind === 'aggregator'
  const prompt = isAgg
    ? // Aggregator: a directory listing MANY sponsors' sweeps. Keep ONLY sweeps
      // run by a points/miles loyalty program (or whose prize IS that program's
      // points/miles). Drop third-party/charity/brand giveaways that merely
      // include travel as a prize. Return each sweep's OWN program.
      `Today is ${today}. Below is a sweepstakes-directory page listing many different giveaways. ` +
      `Extract ONLY sweepstakes that are RUN BY a points or miles LOYALTY PROGRAM (airline or hotel) ` +
      `such as: ${LOYALTY_PROGRAMS} - OR whose prize IS that program's points/miles. ` +
      `EXCLUDE everything else: third-party, charity, brand, radio-station, or influencer giveaways ` +
      `that merely include a flight, hotel stay, or travel voucher as a prize but are not run by the ` +
      `loyalty program itself. Return a STRICT JSON array, no prose. Each kept item:\n` +
      `{"program": the loyalty program name (e.g. "Wyndham Rewards"),\n` +
      ` "title": short name of the sweepstakes,\n` +
      ` "prize": what you can win (null if unclear),\n` +
      ` "entry_url": the enter/official-rules link if shown (else null),\n` +
      ` "ends_at": ISO YYYY-MM-DD enter-by date if stated (else null)}\n` +
      `Only use info the page states - never invent. If none qualify, return [].\n\nPAGE:\n${md.slice(0, 12000)}`
    : `Today is ${today}. Below is a page from ${source.program}. Extract every CURRENTLY-RUNNING ` +
      `sweepstakes, giveaway, or prize drawing (NOT generic offers, bonuses, or sales) as a STRICT ` +
      `JSON array, no prose. Each item:\n` +
      `{"title": short name of the sweepstakes,\n` +
      ` "prize": what you can win (null if unclear),\n` +
      ` "entry_url": the enter/register link if the page shows one (else null),\n` +
      ` "mechanic": "daily_entry" if you can enter once per day, else "one_time", or "unknown",\n` +
      ` "ends_at": ISO YYYY-MM-DD enter-by/last-day date if stated (else null)}\n` +
      `Only include ACTUAL sweepstakes/giveaways/drawings that are open now. Only use info the page ` +
      `states — never invent a prize or date. If there are none, return [].\n\nPAGE:\n${md.slice(0, 12000)}`
  let msg
  try {
    msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    return []
  }
  try {
    await logUsage(msg, 'sweepstakes-watch:extract', { program: source.program, kind: source.kind })
  } catch {
    /* non-fatal */
  }
  const first = msg.content[0]
  const text = first && first.type === 'text' ? first.text : ''
  // Slice the JSON array out by its brackets. Haiku sometimes wraps the array in
  // a ```json fence AND appends an explanatory sentence after it ("The page only
  // has offers, no sweepstakes."); a naive fence-strip would leave that prose in
  // and make JSON.parse throw, silently dropping real sweepstakes.
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return []
  const cleaned = text.slice(start, end + 1)
  try {
    const arr = JSON.parse(cleaned)
    if (!Array.isArray(arr)) return []
    // Accept a bare date OR the date portion of an ISO datetime (aggregators
    // often emit "2026-08-09T23:59:00Z").
    const iso = (v: unknown) => {
      if (typeof v !== 'string') return null
      const m = v.match(/^(\d{4}-\d{2}-\d{2})/)
      return m ? m[1] : null
    }
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
    const mech = (v: unknown) =>
      v === 'daily_entry' || v === 'one_time' ? (v as ParsedSweep['mechanic']) : 'unknown'
    return arr
      .map((r: Record<string, unknown>) => ({
        title: str(r.title),
        prize: str(r.prize),
        entry_url: str(r.entry_url),
        mechanic: mech(r.mechanic),
        ends_at: iso(r.ends_at),
        program: str(r.program),
      }))
      .filter((r): r is ParsedSweep => !!r.title) as ParsedSweep[]
  } catch {
    return []
  }
}

export async function runSweepstakesWatch(supabase: SupabaseClient): Promise<WatchResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const result: WatchResult = {
    sourcesChecked: 0,
    sourcesScraped: 0,
    running: 0,
    newlyFound: [],
    ended: 0,
    expired: 0,
    deadLinks: 0,
    errors: [],
  }

  const { data: sources } = await supabase
    .from('sweepstakes_sources')
    .select('id, program, url, kind')
    .eq('active', true)
  if (!sources?.length) return result

  const nowIso = new Date().toISOString()

  for (const src of sources as SweepstakesSource[]) {
    result.sourcesChecked++
    let md = ''
    try {
      md = await firecrawlMarkdown(src.url)
    } catch (err) {
      result.errors.push({ program: src.program, error: err instanceof Error ? err.message : String(err) })
      continue
    }
    if (!md) {
      // scrape failed / empty — do NOT end this source's sweepstakes on a miss
      result.errors.push({ program: src.program, error: 'empty scrape' })
      continue
    }
    result.sourcesScraped++

    const parsed = await extractSweepstakes(anthropic, src, md)
    // Identity is program+title. For aggregator sources many programs share the
    // page, so key the "seen this run" set by program+title, not title alone.
    const seenKeys = new Set<string>()

    for (const s of parsed) {
      // Program sources carry their own label; aggregator items bring their own
      // program (already filtered to loyalty programs). Skip an aggregator item
      // the model couldn't attribute to a program.
      const program = src.kind === 'aggregator' ? s.program : src.program
      if (!program) continue
      const key = `${program} ${s.title}`
      seenKeys.add(key)
      // is this new? (no running row with this program+title yet)
      const { data: existing } = await supabase
        .from('sweepstakes')
        .select('id')
        .eq('program', program)
        .eq('title', s.title)
        .maybeSingle()
      if (!existing) result.newlyFound.push(`${program}: ${s.title}`)

      const { error } = await supabase.from('sweepstakes').upsert(
        {
          source_id: src.id,
          program,
          title: s.title,
          prize: s.prize,
          entry_url: s.entry_url,
          source_url: src.url,
          mechanic: s.mechanic,
          ends_at: s.ends_at,
          status: 'running',
          last_seen: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'program,title' },
      )
      if (error) result.errors.push({ program, error: error.message })
    }

    // mark ended: running rows from THIS source that we did not see this run
    const { data: current } = await supabase
      .from('sweepstakes')
      .select('id, program, title')
      .eq('source_id', src.id)
      .eq('status', 'running')
    for (const row of current ?? []) {
      const key = `${row.program} ${row.title}`
      if (!seenKeys.has(key)) {
        await supabase
          .from('sweepstakes')
          .update({ status: 'ended', updated_at: nowIso })
          .eq('id', row.id)
        result.ended++
      }
    }
  }

  // Auto-expire: any running sweep whose enter-by date is in the past. Runs after
  // all upserts, so a sweep still listed on its source but past its deadline still
  // gets ended; and it runs even when a source failed to scrape this cycle. Dates
  // are stored as YYYY-MM-DD text, so a lexicographic `< today` compares correctly.
  const today = nowIso.slice(0, 10)
  const { data: expiredRows } = await supabase
    .from('sweepstakes')
    .update({ status: 'ended', updated_at: nowIso })
    .eq('status', 'running')
    .not('ends_at', 'is', null)
    .lt('ends_at', today)
    .select('id')
  result.expired = expiredRows?.length ?? 0

  // Link check: never leave a dead "Enter" link live. For each running sweep,
  // validate the deep entry link; if it's dead but the source page still works,
  // drop the entry link so the card falls back to the source; if nothing works,
  // end the sweep. (This is why one broken heatperkstickets.com link slipped
  // through before the check existed.)
  const { data: liveRows } = await supabase
    .from('sweepstakes')
    .select('id, entry_url, source_url')
    .eq('status', 'running')
  for (const s of liveRows ?? []) {
    const entry = (s.entry_url as string | null ?? '').trim()
    const source = (s.source_url as string | null ?? '').trim()
    const entryValid = /^https?:\/\//i.test(entry) && !entry.endsWith('#')
    const sourceValid = /^https?:\/\//i.test(source)
    if (entryValid && isDeadStatus(await linkStatus(entry))) {
      if (sourceValid && !isDeadStatus(await linkStatus(source))) {
        await supabase.from('sweepstakes').update({ entry_url: null, updated_at: nowIso }).eq('id', s.id)
      } else {
        await supabase.from('sweepstakes').update({ status: 'ended', updated_at: nowIso }).eq('id', s.id)
        result.deadLinks++
      }
    } else if (!entryValid) {
      if (!sourceValid || isDeadStatus(await linkStatus(source))) {
        await supabase.from('sweepstakes').update({ status: 'ended', updated_at: nowIso }).eq('id', s.id)
        result.deadLinks++
      }
    }
  }

  const { count } = await supabase
    .from('sweepstakes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'running')
  result.running = count ?? 0

  return result
}
