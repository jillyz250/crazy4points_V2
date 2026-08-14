'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

export interface JillsTake {
  id: string
  note: string
  program_slug: string | null
  status: 'new' | 'used' | 'archived'
  created_at: string
  used_at: string | null
}

const VALID_STATUS = ['new', 'used', 'archived'] as const

/** Capture a new take (the zero-friction jot box). */
export async function addTakeAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const note = String(formData.get('note') || '').trim()
  if (!note) return
  const program = String(formData.get('program_slug') || '').trim().toLowerCase()
  const sb = createAdminClient()
  await sb.from('jills_takes').insert({
    note: note.slice(0, 4000),
    program_slug: program || null,
    status: 'new',
  })
  revalidatePath('/admin')
  revalidatePath('/admin/takes')
}

/** Move a take between backlog states (new / used / archived). Sets used_at
 *  when marking used so we can see when a take made it into an issue. */
export async function setTakeStatusAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '')
  if (!id || !VALID_STATUS.includes(status as (typeof VALID_STATUS)[number])) return
  const sb = createAdminClient()
  const update: Record<string, unknown> = { status }
  update.used_at = status === 'used' ? new Date().toISOString() : null
  await sb.from('jills_takes').update(update).eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/admin/takes')
}

/** Edit a take's text in place. */
export async function updateTakeAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') || '')
  const note = String(formData.get('note') || '').trim()
  if (!id || !note) return
  const sb = createAdminClient()
  await sb.from('jills_takes').update({ note: note.slice(0, 4000) }).eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/admin/takes')
}

/** Fetch takes for a given status (default: the 'new' backlog, newest first). */
export async function listTakes(status: 'new' | 'used' | 'archived' = 'new'): Promise<JillsTake[]> {
  const sb = createAdminClient()
  const { data } = await sb
    .from('jills_takes')
    .select('id, note, program_slug, status, created_at, used_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
  return (data ?? []) as JillsTake[]
}

/** Count of un-used takes — the backlog depth shown on the dashboard. */
export async function countBacklogTakes(): Promise<number> {
  const sb = createAdminClient()
  const { count } = await sb
    .from('jills_takes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')
  return count ?? 0
}
