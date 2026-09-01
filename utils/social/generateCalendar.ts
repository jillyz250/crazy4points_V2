/**
 * Roll the recurring social anchors forward into `social_calendar` as `suggested`
 * rows (the "Recommended" lane). Idempotent: it inserts only slots that do not
 * already exist for that (post_date, platform, source_ref), so a slot Jill already
 * promoted to `planned` or marked `skipped` is never re-suggested. Called by the
 * daily cron and by scripts for an immediate fill. Reviewed with Copilot 2026-09-01.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateAnchorSlots } from '@/lib/socialAnchors'

export async function runAnchorGeneration(
  db: SupabaseClient,
  todayISO: string,
  weeksAhead = 8,
): Promise<{ considered: number; inserted: number }> {
  const to = new Date(`${todayISO}T00:00:00Z`)
  to.setUTCDate(to.getUTCDate() + weeksAhead * 7)
  const toISO = to.toISOString().slice(0, 10)

  const slots = generateAnchorSlots(todayISO, toISO)
  if (!slots.length) return { considered: 0, inserted: 0 }

  // What already exists in the window for these anchors (any status) — so we never
  // duplicate, and never re-suggest something already promoted or skipped.
  const refs = [...new Set(slots.map((s) => s.source_ref))]
  const { data: existing } = await db
    .from('social_calendar')
    .select('post_date, platform, source_ref')
    .eq('source_type', 'recurring')
    .in('source_ref', refs)
    .gte('post_date', todayISO)
    .lte('post_date', toISO)
  const have = new Set((existing ?? []).map((r) => `${r.post_date}|${r.platform}|${r.source_ref}`))

  const fresh = slots.filter((s) => !have.has(`${s.post_date}|${s.platform}|${s.source_ref}`))
  if (!fresh.length) return { considered: slots.length, inserted: 0 }

  const { error } = await db.from('social_calendar').insert(fresh)
  if (error) throw new Error(`social_calendar insert failed: ${error.message}`)
  return { considered: slots.length, inserted: fresh.length }
}
