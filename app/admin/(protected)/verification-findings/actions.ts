'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Dismiss a re-verification finding (false positive / already handled / source
 * was wrong). The weekly sweep is detection-only: it flags discrepancies between
 * our stored transfer data and current rosters. The editor verifies against the
 * issuer's own page, applies any real change manually (per the issuer-source
 * rule), then dismisses the finding to clear the queue.
 */
export async function dismissFinding(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('verification_findings').update({ status: 'dismissed' }).eq('id', id)
  revalidatePath('/admin/verification-findings')
}
