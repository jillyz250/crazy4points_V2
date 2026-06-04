'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Dismiss a change signal as noise / not applicable / already handled.
 *
 * The announcement monitor is detection-only: it flags potential transfer-
 * partner / ratio changes from issuer newsrooms + blogs for human review. The
 * editor verifies against our stored data, applies any real change manually
 * (per the issuer-source rule), then dismisses the signal to clear the queue.
 */
export async function dismissSignal(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('change_signals').update({ status: 'dismissed' }).eq('id', id)
  revalidatePath('/admin/change-signals')
}
