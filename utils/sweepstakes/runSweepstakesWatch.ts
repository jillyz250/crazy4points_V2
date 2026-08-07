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
}

export interface ParsedSweep {
  title: string
  prize: string | null
  entry_url: string | null
  mechanic: 'one_time' | 'daily_entry' | 'unknown'
  ends_at: string | null // ISO YYYY-MM-DD
}

export interface WatchResult {
  sourcesChecked: number
  sourcesScraped: number
  running: number
  newlyFound: string[]
  ended: number
  errors: { program: string; error: string }[]
}

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

async function extractSweepstakes(
  anthropic: Anthropic,
  program: string,
  md: string,
): Promise<ParsedSweep[]> {
  const today = new Date().toISOString().slice(0, 10)
  const prompt =
    `Today is ${today}. Below is a page from ${program}. Extract every CURRENTLY-RUNNING ` +
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
    await logUsage(msg, 'sweepstakes-watch:extract', { program })
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
    const iso = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
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
    errors: [],
  }

  const { data: sources } = await supabase
    .from('sweepstakes_sources')
    .select('id, program, url')
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

    const parsed = await extractSweepstakes(anthropic, src.program, md)
    const seenTitles = new Set<string>()

    for (const s of parsed) {
      seenTitles.add(s.title)
      // is this new? (no running row with this program+title yet)
      const { data: existing } = await supabase
        .from('sweepstakes')
        .select('id')
        .eq('program', src.program)
        .eq('title', s.title)
        .maybeSingle()
      if (!existing) result.newlyFound.push(`${src.program}: ${s.title}`)

      const { error } = await supabase.from('sweepstakes').upsert(
        {
          source_id: src.id,
          program: src.program,
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
      if (error) result.errors.push({ program: src.program, error: error.message })
    }

    // mark ended: running rows from THIS source that we did not see this run
    const { data: current } = await supabase
      .from('sweepstakes')
      .select('id, title')
      .eq('source_id', src.id)
      .eq('status', 'running')
    for (const row of current ?? []) {
      if (!seenTitles.has(row.title as string)) {
        await supabase
          .from('sweepstakes')
          .update({ status: 'ended', updated_at: nowIso })
          .eq('id', row.id)
        result.ended++
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
