'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/** Add a free-text reminder / to-do. dueDate is optional (YYYY-MM-DD). */
export async function addReminder(input: {
  title: string
  dueDate?: string | null
  notes?: string | null
  link?: string | null
}) {
  await assertAdmin()
  const title = input.title?.trim()
  if (!title) return
  const supabase = createAdminClient()
  await supabase.from('reminders').insert({
    title,
    due_date: input.dueDate?.trim() || null,
    notes: input.notes?.trim() || null,
    link: input.link?.trim() || null,
  })
  revalidatePath('/admin')
}

/** Toggle a reminder between open and done. */
export async function toggleReminderDone(id: string, done: boolean) {
  await assertAdmin()
  const supabase = createAdminClient()
  await supabase
    .from('reminders')
    .update({
      status: done ? 'done' : 'open',
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq('id', id)
  revalidatePath('/admin')
}

/** Permanently delete a reminder. */
export async function deleteReminder(id: string) {
  await assertAdmin()
  const supabase = createAdminClient()
  await supabase.from('reminders').delete().eq('id', id)
  revalidatePath('/admin')
}
