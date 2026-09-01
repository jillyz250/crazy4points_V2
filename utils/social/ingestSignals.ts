/**
 * Stage 2 of the social calendar: turn real events into `suggested` rows (the
 * Recommended lane), alongside the recurring anchors. Sources: existing social-post
 * reminders (publish-driven), sweepstakes deadlines, and experience closings.
 * Idempotent by `source_ref` — a signal already promoted or skipped is never
 * re-suggested, so no double-tracking (Copilot 2026-09-01). Quality-gated so the
 * rail stays high-signal (timeshare sweeps + low-value regional promos filtered).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { isTimeshareSweep } from '@/lib/sweepstakes/categories'
import type { SocialPlatform } from '@/lib/socialAnchors'

const PLATFORMS: SocialPlatform[] = ['facebook', 'instagram']

type NewSlot = {
  post_date: string
  platform: SocialPlatform
  topic: string
  source_type: 'alert' | 'sweepstakes' | 'experience'
  source_ref: string
  status: 'suggested'
  link_url: string | null
  notes: string | null
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function shiftDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return ymd(d)
}
function clampToday(dateStr: string, todayISO: string): string {
  return dateStr < todayISO ? todayISO : dateStr
}

export async function runSignalIngest(
  db: SupabaseClient,
  todayISO: string,
  weeksAhead = 8,
): Promise<{ inserted: number; bySource: Record<string, number> }> {
  const toISO = shiftDays(todayISO, weeksAhead * 7)
  const candidates: NewSlot[] = []

  // 1) Social-post reminders (dated, publish-driven). Title carries the topic.
  const { data: reminders } = await db
    .from('reminders')
    .select('id, title, due_date, link, status')
    .eq('status', 'open')
    .ilike('title', '%social post%')
    .gte('due_date', todayISO)
    .lte('due_date', toISO)
  for (const r of reminders ?? []) {
    for (const platform of PLATFORMS) {
      candidates.push({
        post_date: r.due_date,
        platform,
        topic: String(r.title).replace(/\s*[:|-]\s*(update card page|social post).*$/i, '').trim() || String(r.title),
        source_type: 'alert',
        source_ref: `reminder:${r.id}`,
        status: 'suggested',
        link_url: r.link ?? null,
        notes: 'From a published-alert social reminder.',
      })
    }
  }

  // 2) Sweepstakes deadlines — FEATURED only (Jill's curation signal). Value-gating
  //    is unreliable (regional promos bury a big grand-prize number in the text), so
  //    we surface only sweeps she has featured, and still exclude timeshare.
  const { data: sweeps } = await db
    .from('sweepstakes')
    .select('id, title, prize, program, ends_at, status, posted_social, featured')
    .eq('status', 'running')
    .eq('posted_social', false)
    .eq('featured', true)
    .not('ends_at', 'is', null)
    .gte('ends_at', todayISO)
    .lte('ends_at', toISO)
  for (const s of sweeps ?? []) {
    if (isTimeshareSweep(s.program, s.prize, s.title)) continue
    const postDate = clampToday(shiftDays(s.ends_at, -3), todayISO) // last-chance, 3 days out
    for (const platform of PLATFORMS) {
      candidates.push({
        post_date: postDate,
        platform,
        topic: String(s.title).slice(0, 120),
        source_type: 'sweepstakes',
        source_ref: `sweep:${s.id}`,
        status: 'suggested',
        link_url: '/sweepstakes',
        notes: `Sweepstakes ends ${String(s.ends_at).slice(0, 10)}. Points/miles giveaway, honest bid-vs-enter framing.`,
      })
    }
  }

  // 3) Experience closings — FEATURED only + future close_date. Most experiences are
  //    directory listings, not post-worthy (our own Phase 8 finding), so we surface
  //    only the ones Jill has featured, never the whole firehose.
  const { data: exps } = await db
    .from('experience_listings')
    .select('id, title, close_date, status, program_slug')
    .eq('status', 'active')
    .eq('featured', true)
    .not('close_date', 'is', null)
    .gte('close_date', todayISO)
    .lte('close_date', toISO)
    .limit(40)
  for (const e of exps ?? []) {
    const postDate = clampToday(shiftDays(e.close_date, -2), todayISO)
    for (const platform of PLATFORMS) {
      candidates.push({
        post_date: postDate,
        platform,
        topic: String(e.title).slice(0, 120),
        source_type: 'experience',
        source_ref: `exp:${e.id}`,
        status: 'suggested',
        link_url: null,
        notes: `Experience closes ${String(e.close_date).slice(0, 10)} (${e.program_slug}). Last-chance angle; honest bid-vs-redeem.`,
      })
    }
  }

  if (!candidates.length) return { inserted: 0, bySource: {} }

  // Idempotency: skip any (source_ref, post_date, platform) that already exists in
  // ANY status, so promoted/skipped signals never resurface.
  const refs = [...new Set(candidates.map((c) => c.source_ref))]
  const { data: existing } = await db
    .from('social_calendar')
    .select('post_date, platform, source_ref')
    .in('source_ref', refs)
  const have = new Set((existing ?? []).map((r) => `${r.post_date}|${r.platform}|${r.source_ref}`))
  const fresh = candidates.filter((c) => !have.has(`${c.post_date}|${c.platform}|${c.source_ref}`))
  if (!fresh.length) return { inserted: 0, bySource: {} }

  const { error } = await db.from('social_calendar').insert(fresh)
  if (error) throw new Error(`signal ingest insert failed: ${error.message}`)

  const bySource: Record<string, number> = {}
  for (const f of fresh) bySource[f.source_type] = (bySource[f.source_type] ?? 0) + 1
  return { inserted: fresh.length, bySource }
}
