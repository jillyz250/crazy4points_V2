/**
 * orgAging — the "nothing falls off" monitor (Jill, 2026-09-03).
 *
 * Every queue in the system has a closed loop (a terminal state), but part 4 of a
 * real loop is AGING: old open items must escalate, not wait patiently forever.
 * This scans each queue for its oldest OPEN item and flags the queue "overdue" when
 * that item is older than the queue's threshold. Surfaced on the dashboard so
 * anything quietly rotting becomes visible regardless of whether the ritual ran.
 *
 * Owned by Morgan (Chief of Staff) — operational integrity across all domains.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type AgingRow = {
  key: string
  label: string
  open: number
  oldestDays: number | null
  threshold: number
  overdue: boolean
  link: string
}

type QueueSpec = {
  key: string
  label: string
  table: string
  dateCol: string
  threshold: number // days; oldest open item older than this = overdue
  link: string
  filters: [string, 'eq' | 'neq' | 'is', unknown][]
}

// Thresholds tuned per queue: how long an OPEN item may sit before it escalates.
// Fast-moving/high-stakes queues (errors, decisions) are short; content backlogs longer.
const QUEUES: QueueSpec[] = [
  { key: 'errors', label: 'Unresolved system errors', table: 'system_errors', dateCol: 'created_at', threshold: 2, link: '/admin', filters: [['resolved_at', 'is', null]] },
  { key: 'decisions', label: 'Decisions awaiting you', table: 'decision_log', dateCol: 'created_at', threshold: 3, link: '/admin/decisions', filters: [['status', 'eq', 'pending']] },
  { key: 'ideas_approved', label: 'Approved ideas not yet shipped', table: 'employee_ideas', dateCol: 'created_at', threshold: 7, link: '/admin', filters: [['status', 'eq', 'approved']] },
  { key: 'vendor_radar', label: 'Vendor updates to triage', table: 'vendor_radar', dateCol: 'received_at', threshold: 10, link: '/admin/expenses', filters: [['status', 'eq', 'new']] },
  { key: 'ideas_new', label: 'Ideas awaiting a decision', table: 'employee_ideas', dateCol: 'created_at', threshold: 14, link: '/admin', filters: [['status', 'eq', 'new']] },
  { key: 'reminders', label: 'Open reminders', table: 'reminders', dateCol: 'created_at', threshold: 14, link: '/admin', filters: [['status', 'neq', 'done']] },
  { key: 'intel', label: 'Undecided intel (triage)', table: 'intel_items', dateCol: 'created_at', threshold: 14, link: '/admin/triage', filters: [['processed', 'eq', false], ['rejected_at', 'is', null], ['archived_at', 'is', null]] },
  { key: 'tasks', label: 'Open assigned tasks', table: 'employee_tasks', dateCol: 'created_at', threshold: 21, link: '/admin', filters: [['status', 'neq', 'done']] },
]

/** Scan every queue; return one row per queue (with open count + oldest age + overdue flag). */
export async function computeAging(db: SupabaseClient): Promise<AgingRow[]> {
  const rows = await Promise.all(
    QUEUES.map(async (q): Promise<AgingRow> => {
      try {
        let query = db.from(q.table).select(q.dateCol, { count: 'exact' }).order(q.dateCol, { ascending: true }).limit(1)
        for (const [col, op, val] of q.filters) {
          query = (query as Record<string, (c: string, v: unknown) => typeof query>)[op](col, val)
        }
        const { data, count, error } = await query
        if (error) return { key: q.key, label: q.label, open: 0, oldestDays: null, threshold: q.threshold, overdue: false, link: q.link }
        const oldestIso = (data?.[0] as unknown as Record<string, string> | undefined)?.[q.dateCol]
        const oldestDays = oldestIso ? Math.floor((Date.now() - Date.parse(oldestIso)) / 86_400_000) : null
        const open = count ?? 0
        const overdue = open > 0 && oldestDays != null && oldestDays > q.threshold
        return { key: q.key, label: q.label, open, oldestDays, threshold: q.threshold, overdue, link: q.link }
      } catch {
        return { key: q.key, label: q.label, open: 0, oldestDays: null, threshold: q.threshold, overdue: false, link: q.link }
      }
    }),
  )
  return rows
}

/** Just the overdue queues (the escalation list), worst-overshoot first. */
export function overdueOnly(rows: AgingRow[]): AgingRow[] {
  return rows
    .filter((r) => r.overdue)
    .sort((a, b) => (b.oldestDays! - b.threshold) - (a.oldestDays! - a.threshold))
}
