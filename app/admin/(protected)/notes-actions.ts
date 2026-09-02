'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

export interface DashboardNote {
  id: string
  body: string
  sent_to_takes: boolean
  created_at: string
  updated_at: string
}

/** Create a note (the zero-friction jot box, saves on blur). Returns the row. */
export async function createNote(body: string): Promise<DashboardNote | null> {
  await assertAdmin()
  const text = body.trim()
  if (!text) return null
  const sb = createAdminClient()
  const { data } = await sb
    .from('dashboard_notes')
    .insert({ body: text.slice(0, 4000) })
    .select('id, body, sent_to_takes, created_at, updated_at')
    .maybeSingle()
  revalidatePath('/admin')
  revalidatePath('/admin/notepad')
  return (data as DashboardNote) ?? null
}

/** Edit a note in place (saves on blur). Empty body deletes it. */
export async function updateNote(id: string, body: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const sb = createAdminClient()
  const text = body.trim()
  if (!text) {
    await sb.from('dashboard_notes').delete().eq('id', id)
  } else {
    await sb.from('dashboard_notes').update({ body: text.slice(0, 4000), updated_at: new Date().toISOString() }).eq('id', id)
  }
  revalidatePath('/admin')
  revalidatePath('/admin/notepad')
}

/** Delete a note. */
export async function deleteNote(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const sb = createAdminClient()
  await sb.from('dashboard_notes').delete().eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/admin/notepad')
}

/**
 * Promote a note to Jill's Takes. The jills_takes table already exists, so this
 * is wired live (not a stub): it inserts the note as a new take and flags the
 * note so the UI can show it's been sent.
 */
export async function sendNoteToTakes(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const sb = createAdminClient()
  const { data: note } = await sb.from('dashboard_notes').select('body').eq('id', id).maybeSingle()
  if (!note) return
  await sb.from('jills_takes').insert({ note: String((note as { body: string }).body).slice(0, 4000), status: 'new' })
  await sb.from('dashboard_notes').update({ sent_to_takes: true, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/admin/notepad')
  revalidatePath('/admin/takes')
}
