'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Dismiss a pending observation as noise / not applicable.
 *
 * Phase 1 of the transfer-bonus monitor is READ-ONLY for changes: there's no
 * Apply path because Citi / Chase / Wells Fargo have per-card-tier ratios
 * that need human judgment about which `tiers[]` the bonus applies to. Editor
 * reviews the observation, copies the suggested SQL from the dashboard, edits
 * it as needed, and runs it manually. Dismiss removes false positives from
 * the queue so the dashboard only shows real work.
 */
export async function dismissObservation(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const reason = String(formData.get('reason') ?? '').trim() || null
  if (!id) return

  const supabase = createAdminClient()
  await supabase
    .from('transfer_bonus_observations')
    .update({ status: 'dismissed', dismissed_reason: reason })
    .eq('id', id)

  revalidatePath('/admin/transfer-bonuses')
}
