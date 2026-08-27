'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Mark an experience listing as reviewed — the "I've looked at this" stamp that
 * clears it from the morning-review list and the admin dashboard card. Any
 * verdict (feature, skip) counts as reviewing it.
 */
export async function markReviewed(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase
    .from('experience_listings')
    .update({ editorial_reviewed_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/experiences')
  revalidatePath('/admin')
}

/**
 * Toggle whether a listing is ⭐ Featured on the public /experiences page.
 * Featuring implies it's been reviewed (so it also stamps editorial_reviewed_at),
 * and revalidates the public page so the gallery updates.
 */
export async function toggleFeatured(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const next = String(formData.get('next') ?? '') === 'true'
  if (!id) return
  const supabase = createAdminClient()
  await supabase
    .from('experience_listings')
    .update({
      featured: next,
      featured_at: next ? new Date().toISOString() : null,
      // Featuring is also an editorial review; don't un-review when unfeaturing.
      ...(next ? { editorial_reviewed_at: new Date().toISOString() } : {}),
    })
    .eq('id', id)
  revalidatePath('/admin/experiences')
  revalidatePath('/admin')
  revalidatePath('/experiences')
}
