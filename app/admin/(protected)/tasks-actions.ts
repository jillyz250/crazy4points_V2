'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * "My Tasks" — Jill's personal, checkable to-do list (Devon, 2026-09-03).
 * Distinct from the team's "Needs you today" decision queue and from the freeform
 * Notepad: these are HER to-dos that PERSIST until she checks them off. Nothing
 * else clears them. Table: public.jill_tasks (migration 658). Admin-only, so we
 * gate every action with assertAdmin() and use the service-role client (RLS is on
 * with no public policies — service role bypasses it, same model as notes-actions).
 */

export interface JillTask {
  id: string
  title: string
  done: boolean
  source: string | null
  link: string | null
  created_at: string
  done_at: string | null
}

const SELECT = 'id, title, done, source, link, created_at, done_at'

/** Add a task (type + enter on the dashboard). Returns the created row. */
export async function addTask(title: string, link?: string): Promise<JillTask | null> {
  await assertAdmin()
  const text = title.trim()
  if (!text) return null
  const url = (link ?? '').trim()
  const sb = createAdminClient()
  const { data } = await sb
    .from('jill_tasks')
    .insert({ title: text.slice(0, 500), link: url ? url.slice(0, 2000) : null, source: 'manual' })
    .select(SELECT)
    .maybeSingle()
  revalidatePath('/admin')
  return (data as JillTask) ?? null
}

/**
 * Check a task off (or back on). done=true stamps done_at=now and drops it from
 * the open list; done=false clears done_at and returns it to open. The row is
 * never hard-deleted here — it persists in the "Done" section.
 */
export async function toggleTask(id: string, done: boolean): Promise<void> {
  await assertAdmin()
  if (!id) return
  const sb = createAdminClient()
  await sb
    .from('jill_tasks')
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq('id', id)
  revalidatePath('/admin')
}

/** Permanently remove a task (cleanup only — check-off is the normal path). */
export async function deleteTask(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const sb = createAdminClient()
  await sb.from('jill_tasks').delete().eq('id', id)
  revalidatePath('/admin')
}
