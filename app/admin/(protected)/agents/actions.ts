'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

const VALID = ['fixed', 'dismissed', 'false_positive'] as const

/**
 * Resolve a fact-checker finding from the /admin/agents inbox. It leaves the
 * inbox but stays in the ledger for the accuracy scorecard (guarantee G-2):
 *   fixed          = discrepancy confirmed + our page corrected
 *   dismissed      = acknowledged, no change needed
 *   false_positive = the checker was wrong (signal to tune it)
 */
export async function resolveFinding(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const resolution = String(formData.get('resolution') ?? '').trim()
  if (!id || !(VALID as readonly string[]).includes(resolution)) return
  const supabase = createAdminClient()
  await supabase
    .from('claim_verifications')
    .update({ reviewed_at: new Date().toISOString(), resolution })
    .eq('id', id)
  revalidatePath('/admin/agents')
}
