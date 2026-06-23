/**
 * Intel triage self-cleaning sweep.
 *
 * The auto-triage writes a `triage_decision` recommendation but never applies
 * it, so intel rows sit at processed=false forever — the queue silently fills
 * with already-rejected and expired items (found 17 auto-rejected + 2 expired
 * lingering as phantom "unprocessed" backlog). This sweep honours the triage:
 *
 *  1. REJECTED + 3-day grace: rows the AI rejected, untouched for >3 days, get
 *     applied (processed=true, rejected_at=now). The grace window leaves them
 *     visible long enough to override on the triage page before they clear.
 *  2. EXPIRED: open rows whose expires_at has passed get archived
 *     (processed=true, archived_at=now) — a dead deal isn't worth triaging.
 *  3. NEWSLETTER_IDEA + 21-day grace: items flagged for the newsletter but never
 *     captured (no consumer marks them processed) get archived once stale —
 *     a 3-week-old newsletter idea is past the weekly cadence anyway. Longer
 *     grace than rejects since they carry content value.
 *
 * Detection-to-action only on decisions already made (by the AI or by time);
 * it never invents a verdict. Runs daily via /api/cron/intel-triage-sweep.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

const GRACE_DAYS = 3
const NEWSLETTER_IDEA_GRACE_DAYS = 21

export interface IntelSweepResult {
  ok: boolean
  rejectedCleared: number
  expiredArchived: number
  newsletterIdeaArchived: number
  errors: number
}

export async function sweepTriagedIntel(supabase: SupabaseClient): Promise<IntelSweepResult> {
  const now = new Date()
  const nowIso = now.toISOString()
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * 86_400_000).toISOString()
  const newsletterCutoff = new Date(now.getTime() - NEWSLETTER_IDEA_GRACE_DAYS * 86_400_000).toISOString()
  let rejectedCleared = 0
  let expiredArchived = 0
  let newsletterIdeaArchived = 0
  let errors = 0

  // 1. Apply AI 'rejected' decisions past the grace window.
  {
    const { data, error } = await supabase
      .from('intel_items')
      .update({
        processed: true,
        rejected_at: nowIso,
        rejected_reason: 'auto:triage-rejected (3-day grace elapsed)',
      })
      .eq('processed', false)
      .is('rejected_at', null)
      .eq('triage_decision', 'rejected')
      .lt('triage_decided_at', graceCutoff)
      .select('id')
    if (error) errors++
    else rejectedCleared = data?.length ?? 0
  }

  // 2. Archive open items whose expiry has passed.
  {
    const { data, error } = await supabase
      .from('intel_items')
      .update({ processed: true, archived_at: nowIso })
      .eq('processed', false)
      .is('rejected_at', null)
      .is('archived_at', null)
      .not('expires_at', 'is', null)
      .lt('expires_at', nowIso)
      .select('id')
    if (error) errors++
    else expiredArchived = data?.length ?? 0
  }

  // 3. Archive stale 'newsletter_idea' items (no consumer ever marks them done).
  {
    const { data, error } = await supabase
      .from('intel_items')
      .update({ processed: true, archived_at: nowIso })
      .eq('processed', false)
      .is('rejected_at', null)
      .is('archived_at', null)
      .eq('triage_decision', 'newsletter_idea')
      .lt('triage_decided_at', newsletterCutoff)
      .select('id')
    if (error) errors++
    else newsletterIdeaArchived = data?.length ?? 0
  }

  return { ok: errors === 0, rejectedCleared, expiredArchived, newsletterIdeaArchived, errors }
}
