'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
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
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('change_signals').update({ status: 'dismissed' }).eq('id', id)
  revalidatePath('/admin/accuracy')
}

/**
 * Snooze a signal: hide it from the queue until `days` from now (default 30),
 * then it auto-resurfaces. For speculative "check back later" signals (a change
 * announced as "coming soon" but not yet live) that are neither noise nor
 * actionable today. status stays 'new' — it's still an open item, just deferred.
 */
export async function snoozeSignal(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const days = parseInt(String(formData.get('days') ?? '30'), 10)
  const until = new Date(Date.now() + (Number.isFinite(days) ? days : 30) * 86_400_000).toISOString()
  const supabase = createAdminClient()
  await supabase.from('change_signals').update({ status: 'new', snoozed_until: until }).eq('id', id)
  revalidatePath('/admin/accuracy')
}
