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
import { IDEA_SELECT, IDEA_AREAS, type EmployeeIdea, type IdeaArea } from './ideas'

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

  // Close the idea loop: if this task came from an approved idea, finishing it
  // auto-ships the idea (approved -> shipped), so nothing dangles. Non-fatal.
  if (status === 'done') {
    try {
      const { data: t } = await db
        .from('employee_tasks')
        .select('source_idea_id')
        .eq('id', id)
        .maybeSingle()
      const ideaId = t?.source_idea_id as string | null
      if (ideaId) {
        await db
          .from('employee_ideas')
          .update({ status: 'shipped', shipped_at: now })
          .eq('id', ideaId)
      }
    } catch {
      /* loop-close is a convenience; never block the status change */
    }
  }

  if (employeeSlug) revalidatePath(`/admin/org/${employeeSlug}`)
  revalidatePath('/admin')
}

/**
 * Save the hero "Notes" sticky (employees.quick_note, migration 662) — Jill's
 * private jot about a head / their current work. Saves on blur; empty clears it.
 * Same admin-gated, service-role model as the note/task actions above.
 */
export async function setQuickNote(slug: string, text: string): Promise<void> {
  await assertAdmin()
  const s = (slug || '').trim()
  if (!s) return
  const db = createAdminClient()
  const body = (text || '').trim()
  await db
    .from('employees')
    .update({ quick_note: body ? body.slice(0, 4000) : null })
    .eq('slug', s)
  revalidatePath(`/admin/org/${s}`)
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

/* ── Ideas box — employee_ideas (migration 663) ──────────────────────────────
 * Each employee suggests improvements to THEIR area; Jill acts on them here.
 * Admin-gated, service-role (RLS on, no public policies). Types + the sort
 * helper live in ./ideas so this 'use server' module only exports async fns. */

/** Add an idea for this employee (Jill can jot one for them). Returns the row. */
export async function addIdea(
  employeeSlug: string,
  idea: string,
  area: IdeaArea = 'other',
): Promise<EmployeeIdea | null> {
  await assertAdmin()
  const slug = (employeeSlug || '').trim()
  const text = (idea || '').trim()
  if (!slug || !text) return null
  const a: IdeaArea = IDEA_AREAS.includes(area) ? area : 'other'

  const db = createAdminClient()
  const { data } = await db
    .from('employee_ideas')
    .insert({
      employee_slug: slug,
      idea: text.slice(0, 2000),
      area: a,
      status: 'new',
      created_by: 'jill',
    })
    .select(IDEA_SELECT)
    .maybeSingle()

  revalidatePath(`/admin/org/${slug}`)
  return (data as EmployeeIdea) ?? null
}

/** Approve or reject an idea (stamps decided_at; optional note). */
export async function decideIdea(
  id: string,
  decision: 'approved' | 'rejected',
  employeeSlug: string,
  note?: string,
): Promise<void> {
  await assertAdmin()
  if (!id || (decision !== 'approved' && decision !== 'rejected')) return
  const trimmed = (note ?? '').trim()
  const db = createAdminClient()

  // Read the idea first: its text/area feed the task, and its current status lets
  // us create the task only on the FIRST approval (re-approving won't duplicate).
  const { data: idea } = await db
    .from('employee_ideas')
    .select('idea, area, status, employee_slug')
    .eq('id', id)
    .maybeSingle()
  const wasApproved = (idea?.status as string) === 'approved'

  await db
    .from('employee_ideas')
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_note: trimmed ? trimmed.slice(0, 2000) : null,
    })
    .eq('id', id)

  // Close the loop: approving an idea spins it into a tracked task for its owner,
  // so "yes, do this" becomes real work (approve -> task -> shipped) instead of
  // sitting in an "approved" limbo. First approval only; non-fatal.
  if (decision === 'approved' && !wasApproved && (idea?.idea as string | undefined)?.trim()) {
    const ownerSlug = ((idea?.employee_slug as string) || employeeSlug || '').trim()
    if (ownerSlug) {
      try {
        await db.from('employee_tasks').insert({
          employee_slug: ownerSlug,
          title: (idea!.idea as string).slice(0, 500),
          detail: `Approved idea${idea?.area ? ` (${idea.area})` : ''} — marking this task done auto-ships the idea.`,
          priority: 'P2',
          status: 'todo',
          assigned_by: 'jill',
          link: `/admin/org/${ownerSlug}#ideas`,
          source_idea_id: id, // closes the loop: task done -> idea shipped (setTaskStatus)
        })
        revalidatePath('/admin')
      } catch {
        /* task creation is a convenience; never block the approval */
      }
    }
  }

  if (employeeSlug) revalidatePath(`/admin/org/${employeeSlug}`)
}

/**
 * Park an idea for later (Jill, 2026-09-04). A good idea that isn't for NOW —
 * "revisit in 6 months" — instead of rejecting it (loses it) or approving it
 * (spins a task too early). Sets status='parked' + a revisit_on date so it can't
 * rot: when that date arrives the aging monitor + the owner's brief resurface it
 * for a fresh act/hold/reject. Closed loop by construction.
 */
export async function parkIdea(
  id: string,
  employeeSlug: string,
  revisitOn: string, // YYYY-MM-DD
  note?: string,
): Promise<void> {
  await assertAdmin()
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(revisitOn || '')) return
  const trimmed = (note ?? '').trim()
  const db = createAdminClient()
  await db
    .from('employee_ideas')
    .update({
      status: 'parked',
      revisit_on: revisitOn,
      decided_at: new Date().toISOString(),
      decided_note: trimmed ? trimmed.slice(0, 2000) : null,
    })
    .eq('id', id)
  if (employeeSlug) revalidatePath(`/admin/org/${employeeSlug}`)
  revalidatePath('/admin')
}

/** Mark an idea shipped (status='shipped', shipped_at=now). */
export async function shipIdea(id: string, employeeSlug: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()
  await db
    .from('employee_ideas')
    .update({ status: 'shipped', shipped_at: new Date().toISOString() })
    .eq('id', id)
  if (employeeSlug) revalidatePath(`/admin/org/${employeeSlug}`)
}
