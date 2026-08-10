import type { SupabaseClient } from '@supabase/supabase-js'
import type { TopSweepstakesItem } from './newsletterSlots'

/**
 * Build the newsletter "Top Sweepstakes to Enter" section from the `sweepstakes`
 * table.
 *
 * Curation (Jill's logic): feature only the sweeps she has ALREADY posted to
 * social (posted_social = true) and that are STILL running (status='running';
 * the watcher auto-expires past-deadline ones, and we re-guard on the date here
 * so a stale row never ships a dead link). Soonest deadline first — those are
 * the most urgent to enter — then a shortlist of 3.
 *
 * Detection only — this auto-fills the slot; the editor trims/reorders before
 * sending.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// The section is a tight top-3, not a firehose. The editor trims from here.
const CAP = 3

interface SweepRow {
  program: string | null
  title: string | null
  prize: string | null
  entry_url: string | null
  source_url: string | null
  ends_at: string | null
}

/** "2026-08-09" -> "Ends Aug 9". Null when unparseable. */
function fmtDeadline(ends: string | null): string | null {
  if (!ends) return null
  const m = ends.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const month = MONTHS[parseInt(m[2], 10) - 1]
  if (!month) return null
  return `Ends ${month} ${parseInt(m[3], 10)}`
}

/**
 * Where the card links. Prefer a real entry page; fall back to the source page;
 * finally our own /sweepstakes page. A bare "#" or non-http value is not a link.
 */
function linkFor(row: SweepRow): string {
  const entry = (row.entry_url ?? '').trim()
  if (/^https?:\/\//i.test(entry) && !entry.endsWith('#')) return entry
  const source = (row.source_url ?? '').trim()
  if (/^https?:\/\//i.test(source)) return source
  return '/sweepstakes'
}

export async function getTopSweepstakes(supabase: SupabaseClient): Promise<TopSweepstakesItem[]> {
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('sweepstakes')
    .select('program, title, prize, entry_url, source_url, ends_at')
    .eq('status', 'running')
    .eq('posted_social', true)
    // Belt-and-suspenders vs the watcher's auto-expire: never feature a sweep
    // whose enter-by date has already passed. Undated ones are kept.
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    // Soonest deadline first (most urgent), undated ones last.
    .order('ends_at', { ascending: true, nullsFirst: false })
    .limit(CAP)

  const rows = (data ?? []) as SweepRow[]
  return rows.map((r) => ({
    program: (r.program ?? '').trim(),
    title: (r.title ?? '').trim(),
    prize: r.prize ? String(r.prize).trim() : null,
    deadline: fmtDeadline(r.ends_at),
    link_url: linkFor(r),
  }))
}
