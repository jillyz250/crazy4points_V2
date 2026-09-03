'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import {
  TASK_SELECT,
  PRIORITIES,
  STATUSES,
  type EmployeeTask,
  type TaskPriority,
  type TaskStatus,
} from './tasks'

/**
 * Assigned Tasks — server actions (Devon, 2026-09-03).
 * Makes "assign it to Bill" real. Distinct from:
 *   * jill_tasks   — Jill's OWN personal checklist (tasks-actions.ts)
 *   * decision_log — proposals awaiting Jill's approve/reject (decisions/actions.ts)
 *   * responsibilities — standing duties, a flat list on the employee row
 * An assigned task has an OWNER (a head), a PRIORITY (P1/P2/P3), and a STATUS
 * (todo/in_progress/blocked/done). Table: public.employee_tasks (migration 659).
 * Admin-only: RLS is on with no public policies, so we gate every action with
 * assertAdmin() and use the service-role client (bypasses RLS — same model as
 * notes-actions / tasks-actions). Types + the sort helper live in ./tasks so
 * this 'use server' module only exports async functions.
 */

/** Assign a task to a head. Returns the created row (for optimistic replace). */
export async function assignTask(
  employeeSlug: string,
  title: string,
  priority: TaskPriority = 'P2',
  detail?: string,
): Promise<EmployeeTask | null> {
  await assertAdmin()
  const slug = (employeeSlug || '').trim()
  const text = (title || '').trim()
  if (!slug || !text) return null
  const pri: TaskPriority = PRIORITIES.includes(priority) ? priority : 'P2'
  const note = (detail ?? '').trim()

  const db = createAdminClient()
  const { data } = await db
    .from('employee_tasks')
    .insert({
      employee_slug: slug,
      title: text.slice(0, 500),
      detail: note ? note.slice(0, 4000) : null,
      priority: pri,
      status: 'todo',
      assigned_by: 'jill',
    })
    .select(TASK_SELECT)
    .maybeSingle()

  revalidatePath(`/admin/org/${slug}`)
  revalidatePath('/admin')
  return (data as EmployeeTask) ?? null
}

/**
 * Change a task's status. Any change stamps updated_at=now; moving to 'done'
 * stamps done_at=now (and moving off 'done' clears it).
 */
export async function setTaskStatus(
  id: string,
  status: TaskStatus,
  employeeSlug: string,
): Promise<void> {
  await assertAdmin()
  if (!id || !STATUSES.includes(status)) return
  const now = new Date().toISOString()
  const db = createAdminClient()
  await db
    .from('employee_tasks')
    .update({
      status,
      updated_at: now,
      done_at: status === 'done' ? now : null,
    })
    .eq('id', id)

  if (employeeSlug) revalidatePath(`/admin/org/${employeeSlug}`)
  revalidatePath('/admin')
}

/** Delete a task (cleanup only — status changes are the normal path). */
export async function deleteEmployeeTask(id: string, employeeSlug: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()
  await db.from('employee_tasks').delete().eq('id', id)
  if (employeeSlug) revalidatePath(`/admin/org/${employeeSlug}`)
  revalidatePath('/admin')
}
