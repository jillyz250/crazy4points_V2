'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Reminders actions for the dashboard Reminders panel (Jill, 2026-09-04).
 * Reminders are Jill's dated one-off to-dos (auctions closing, social posts,
 * revisits) — a list distinct from My Tasks. This lets her clear one from the
 * dashboard instead of only in the morning ritual. Admin-gated at the data layer.
 */

/** Mark a reminder done (mirrors the ritual's toggleReminderDone). */
export async function completeReminder(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') || '').trim()
  if (!id) return
  const db = createAdminClient()
  await db
    .from('reminders')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin')
}
