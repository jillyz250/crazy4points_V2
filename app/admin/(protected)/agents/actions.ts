'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Mark a fact-checker finding as reviewed. It leaves the findings inbox but
 * stays in the ledger (for the accuracy scorecard, guarantee G-2). Used for
 * "Dismiss" and for "Done" once a discrepancy has been acted on.
 */
export async function markReviewed(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase
    .from('claim_verifications')
    .update({ reviewed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/agents')
}
