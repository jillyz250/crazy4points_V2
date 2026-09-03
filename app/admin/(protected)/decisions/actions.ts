'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import type { DecisionRow } from '@/lib/admin/logDecision'

/**
 * Decision Log review actions (propose-mode v1). Jill approves/rejects the
 * proposals heads have logged. Each action re-verifies admin authorization at
 * the data layer (server actions are independently-callable POST endpoints).
 *
 * NOTE: this is PROPOSE MODE — approving flips status to 'approved' (the head is
 * cleared to carry the action out); it does NOT itself execute anything. Auto-
 * execution + undo are a later step.
 */

/** Approve a proposed decision — Jill has said yes. */
export async function approveDecision(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()
  await db
    .from('decision_log')
    .update({ status: 'approved', reviewed_by_jill: true, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/decisions')
  revalidatePath('/admin')
}

/**
 * Reject a proposed decision — Jill has said no. Also writes an employee_logs
 * 'shortcoming' for that head so the miss feeds the meters and the head learns
 * (the Decision Log's learning loop).
 */
export async function rejectDecision(id: string, note?: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()

  // Read the row first so we can build a meaningful shortcoming note + find the
  // employee for the FK.
  const { data } = await db.from('decision_log').select('*').eq('id', id).maybeSingle()
  const row = data as DecisionRow | null

  await db
    .from('decision_log')
    .update({ status: 'rejected', reviewed_by_jill: true, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (row) {
    const cleanNote = typeof note === 'string' ? note.trim() : ''
    const label = row.target_label ? ` ${row.target_label}` : ''
    const learningNote = cleanNote || `Jill rejected: ${row.action}${label}`
    const { data: emp } = await db
      .from('employees')
      .select('id')
      .eq('slug', row.employee_slug)
      .maybeSingle()
    if (emp?.id) {
      await db.from('employee_logs').insert({
        employee_id: emp.id,
        type: 'shortcoming',
        note: learningNote,
        actor: 'jill',
      })
    }
  }

  revalidatePath('/admin/decisions')
  revalidatePath('/admin')
  if (row?.employee_slug) revalidatePath(`/admin/org/${row.employee_slug}`)
}

/**
 * Mark a decision as eyeballed by Jill without approving/rejecting — used for
 * auto rows she's just cleared. Doesn't change status.
 */
export async function markDecisionReviewed(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()
  await db
    .from('decision_log')
    .update({ reviewed_by_jill: true, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/decisions')
  revalidatePath('/admin')
}
