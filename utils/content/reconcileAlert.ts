/**
 * reconcileAlertWithPages — check a drafted alert against its program page(s).
 *
 * The cross-check rule ("fix what an alert makes stale") used to rely on the
 * editor remembering to do it. This runs it automatically at draft time by
 * reusing the drift engine (detectConflict): the drafted alert is treated as
 * the "claim" and compared against the tagged program pages' structured facts
 * (transfer ratios, award charts, welcome bonuses, quirks, tiers). If the alert
 * contradicts a page, the caller flags it on the variant so the editor resolves
 * which side is wrong BEFORE publishing — it never auto-overwrites, because the
 * alert is sometimes the incorrect one (e.g. a stale transfer ratio).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { detectConflict, type ConflictResult } from '@/utils/ai/detectConflict'

export async function reconcileAlertWithPages(
  supabase: SupabaseClient,
  args: { alertId: string; title: string; body: string | null; programs: string[] | null },
): Promise<ConflictResult | null> {
  if (!args.programs || args.programs.length === 0) return null
  return detectConflict(supabase, {
    id: args.alertId,
    headline: args.title,
    raw_text: args.body,
    programs: args.programs,
  })
}
