/**
 * Stage 2 of the social calendar: turn real events into `suggested` rows (the
 * Recommended lane), alongside the recurring anchors. Sources: existing social-post
 * reminders (publish-driven), FEATURED sweepstakes, FEATURED experiences. One card
 * per idea (default platform facebook; Jill changes it on the card). Dedup +
 * idempotency via insertDeduped, so conceptual repeats (e.g. a Chase reminder that
 * overlaps the Chase anchor) collapse instead of showing twice. Featured-gating keeps
 * the rail high-signal (Jill's curation toggle) rather than a firehose.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { isTimeshareSweep } from '@/lib/sweepstakes/categories'
import { insertDeduped, type CandidateSlot } from '@/utils/social/insertSlots'

function ymd(d: Date): string { return d.toISOString().slice(0, 10) }
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
): Promise<{ inserted: number; skipped: number; bySource: Record<string, number> }> {
  const toISO = shiftDays(todayISO, weeksAhead * 7)
  const cand: CandidateSlot[] = []
  const base = (o: Partial<CandidateSlot>): CandidateSlot => ({
    platform: 'facebook', status: 'suggested', dedupe_key: null, link_url: null, notes: null,
    post_date: '', topic: '', category: 'other', source_type: 'manual', source_ref: '', ...o,
  })

  // 1) Social-post reminders (dated, publish-driven). Title carries the topic.
  const { data: reminders } = await db
    .from('reminders')
    .select('id, title, due_date, link, status')
    .eq('status', 'open')
    .ilike('title', '%social post%')
    .gte('due_date', todayISO)
    .lte('due_date', toISO)
  for (const r of reminders ?? []) {
    cand.push(base({
      post_date: r.due_date,
      topic: String(r.title).replace(/\s*[:|-]\s*(update card page|social post).*$/i, '').trim() || String(r.title),
      category: 'program_news',
      source_type: 'alert',
      source_ref: `reminder:${r.id}`,
      link_url: r.link ?? null,
      notes: 'From a published-alert social reminder.',
    }))
  }

  // 2) Featured sweepstakes ending within the window (non-timeshare).
  const { data: sweeps } = await db
    .from('sweepstakes')
    .select('id, title, prize, program, ends_at, featured')
    .eq('status', 'running').eq('posted_social', false).eq('featured', true)
    .not('ends_at', 'is', null).gte('ends_at', todayISO).lte('ends_at', toISO)
  for (const s of sweeps ?? []) {
    if (isTimeshareSweep(s.program, s.prize, s.title)) continue
    cand.push(base({
      post_date: clampToday(shiftDays(s.ends_at, -3), todayISO),
      topic: String(s.title).slice(0, 120),
      category: 'sweepstakes',
      source_type: 'sweepstakes',
      source_ref: `sweep:${s.id}`,
      link_url: '/sweepstakes',
      notes: `Sweepstakes ends ${String(s.ends_at).slice(0, 10)}. Points/miles giveaway, honest framing.`,
    }))
  }

  // NOTE: experiences are NOT auto-ingested — Jill adds them deliberately via the
  // "+ Social calendar" button on /admin/experiences (auto-timing: fixed-price posts
  // right away for sell-out risk, auctions ~5 days before close). See
  // app/admin/(protected)/experiences/actions.ts addToSocialCalendar (2026-09-02).

  const { inserted, skipped } = await insertDeduped(db, cand)
  const bySource: Record<string, number> = {}
  for (const c of cand) bySource[c.source_type] = (bySource[c.source_type] ?? 0) + 1
  return { inserted, skipped, bySource }
}
