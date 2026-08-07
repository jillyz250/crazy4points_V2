'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Toggle whether a sweepstakes has been posted to social.
 *
 * The dashboard "Sweepstakes running" tile nudges when running sweepstakes
 * still need a post (posted_social=false). Marking one posted clears it from
 * that nudge. The daily watcher never touches posted_social, so a human toggle
 * is the source of truth here.
 */
export async function togglePosted(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const posted = String(formData.get('posted') ?? '') === 'true'
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('sweepstakes').update({ posted_social: posted }).eq('id', id)
  revalidatePath('/admin/sweepstakes')
  revalidatePath('/admin')
}

/**
 * Manually end a sweepstakes (e.g. a source we can't reliably scrape, or one
 * the watcher keeps re-seeing after it actually closed). Removes it from the
 * running count without waiting for the watcher to notice it vanished.
 */
export async function endSweep(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('sweepstakes').update({ status: 'ended' }).eq('id', id)
  revalidatePath('/admin/sweepstakes')
  revalidatePath('/admin')
}
