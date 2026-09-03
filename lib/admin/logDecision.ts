import 'server-only'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * logDecision — the ONE call a head uses to record a decision it made (or is
 * proposing to make) on Jill's behalf, into `public.decision_log` (mig 655).
 *
 * This is the visibility + safety net for the Morning Meeting reboot: heads
 * absorb the routine volume, but nothing they do is invisible or irreversible.
 * See plans/morning-meeting-reboot.md ("The Decision Log").
 *
 * SCOPE — PROPOSE MODE v1. The defaults record a *proposal* that waits for Jill:
 *   mode='proposed', status='pending'. Auto-execution (mode='auto') and undo are
 *   a LATER step and are intentionally not wired here.
 *
 * Uses the service-role client, which bypasses RLS (the table is RLS-on with no
 * public policies — internal admin-only, same model as the org tables).
 */

export type DecisionStakes = 'low' | 'high'
export type DecisionMode = 'proposed' | 'auto'
export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'undone'

export type LogDecisionInput = {
  /** Which head made/proposed the call (employees.slug). */
  employeeSlug: string
  /** dismiss | skip | bulk_skip | resolve | snooze | publish | edit | feature | send | feedback | other */
  action: string
  /** WHY the head did it — required in practice so Jill can judge fast. */
  reason?: string
  /** low = graduatable to auto later; high = always manual. Defaults 'low'. */
  stakes?: DecisionStakes
  /** proposed = needs Jill (default); auto = head executed (not used in v1). */
  mode?: DecisionMode
  /** experience_listing | sweepstakes | intel_item | reminder | drift | change_signal | draft | ... */
  targetType?: string
  /** id of the affected row (omit for bulk). */
  targetId?: string
  /** Human label ("212 directory-noise experiences"). */
  targetLabel?: string
  /** >1 for bulk actions. Defaults 1. */
  itemCount?: number
}

export type DecisionRow = {
  id: string
  employee_slug: string
  action: string
  stakes: DecisionStakes
  mode: DecisionMode
  status: DecisionStatus
  target_type: string | null
  target_id: string | null
  target_label: string | null
  reason: string | null
  item_count: number
  correlation_id: string | null
  reviewed_by_jill: boolean
  actor: string
  created_at: string
  reviewed_at: string | null
  executed_at: string | null
  undone_at: string | null
}

/** Today's date as YYYY-MM-DD — groups a morning's decisions together. */
export function todayCorrelationId(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Insert a decision_log row and return it. In v1 everything lands as a pending
 * proposal for Jill to approve/reject on /admin/decisions.
 */
export async function logDecision(input: LogDecisionInput): Promise<DecisionRow> {
  const db = createAdminClient()
  const mode: DecisionMode = input.mode ?? 'proposed'
  // A proposal waits ('pending'); an auto action is already done ('executed').
  const status: DecisionStatus = mode === 'auto' ? 'executed' : 'pending'

  const row = {
    employee_slug: input.employeeSlug,
    action: input.action,
    reason: input.reason ?? null,
    stakes: input.stakes ?? 'low',
    mode,
    status,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    target_label: input.targetLabel ?? null,
    item_count: input.itemCount ?? 1,
    correlation_id: todayCorrelationId(),
    actor: 'agent',
  }

  const { data, error } = await db.from('decision_log').insert(row).select('*').single()
  if (error) throw new Error(`logDecision failed: ${error.message}`)
  return data as DecisionRow
}
