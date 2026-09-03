/**
 * Assigned Tasks — shared types + pure helpers (Devon, 2026-09-03).
 * Kept OUT of actions.ts because a 'use server' module may only export async
 * functions; the type exports, constants, and the sync sort helper live here so
 * both the server page and the client board can import them.
 * Table: public.employee_tasks (migration 659).
 */

export type TaskPriority = 'P1' | 'P2' | 'P3'
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'

export interface EmployeeTask {
  id: string
  employee_slug: string
  title: string
  detail: string | null
  priority: TaskPriority
  status: TaskStatus
  assigned_by: string | null
  link: string | null
  created_at: string
  updated_at: string
  due_at: string | null
  done_at: string | null
}

export const TASK_SELECT =
  'id, employee_slug, title, detail, priority, status, assigned_by, link, created_at, updated_at, due_at, done_at'

export const PRIORITIES: TaskPriority[] = ['P1', 'P2', 'P3']
export const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']

/**
 * Open-task sort order = the order of the org: P1 first, then P2, P3, then
 * oldest within a priority. Used identically after an optimistic status flip
 * (client) and on the next server load.
 */
export function sortOpenTasks(tasks: EmployeeTask[]): EmployeeTask[] {
  const rank: Record<TaskPriority, number> = { P1: 0, P2: 1, P3: 2 }
  return [...tasks].sort(
    (a, b) =>
      rank[a.priority] - rank[b.priority] ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}
