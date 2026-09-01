/**
 * Roll the recurring social anchors forward into `social_calendar` as `suggested`
 * rows (the "Recommended" lane). Dedup + idempotency handled by insertDeduped, so a
 * slot already promoted/skipped or conceptually duplicated is never re-suggested.
 * Called by the daily cron and by scripts. Reviewed with Copilot 2026-09-01.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateAnchorSlots } from '@/lib/socialAnchors'
import { insertDeduped } from '@/utils/social/insertSlots'

export async function runAnchorGeneration(
  db: SupabaseClient,
  todayISO: string,
  weeksAhead = 8,
): Promise<{ considered: number; inserted: number }> {
  const to = new Date(`${todayISO}T00:00:00Z`)
  to.setUTCDate(to.getUTCDate() + weeksAhead * 7)
  const slots = generateAnchorSlots(todayISO, to.toISOString().slice(0, 10))
  if (!slots.length) return { considered: 0, inserted: 0 }
  const { inserted } = await insertDeduped(db, slots)
  return { considered: slots.length, inserted }
}
