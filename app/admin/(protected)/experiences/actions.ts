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
 * Add an experience to the social content calendar with auto-timing (Jill,
 * 2026-09-02). Fixed-price experiences post RIGHT AWAY (tomorrow) because limited
 * packages can sell out well before the close date; auctions post ~5 days before
 * close (bid lead time, no sell-out risk). Lands as a planned post you can then
 * draft. Idempotent by source_ref; also marks the experience reviewed.
 */
export async function addToSocialCalendar(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  const { data: e } = await supabase
    .from('experience_listings')
    .select('id, title, points_required, current_bid, close_date, detail_url')
    .eq('id', id)
    .single()
  if (!e) return

  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const addDays = (iso: string, n: number) => {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + n)
    return d.toISOString().slice(0, 10)
  }
  const isAuction = e.current_bid != null
  let postDate: string
  if (isAuction && e.close_date) {
    const wanted = addDays(e.close_date, -5) // 5 days before an auction closes
    postDate = wanted < todayET ? todayET : wanted
  } else {
    postDate = addDays(todayET, 1) // fixed-price (or no close): post right away — sell-out risk
  }

  // Idempotent: don't double-add the same experience.
  const ref = `exp:${id}`
  const { data: existing } = await supabase
    .from('social_calendar').select('id').eq('source_ref', ref).limit(1)
  if (!existing?.length) {
    await supabase.from('social_calendar').insert({
      post_date: postDate,
      platform: 'facebook',
      topic: String(e.title).slice(0, 120),
      category: 'experience',
      source_type: 'experience',
      source_ref: ref,
      status: 'planned',
      link_url: e.detail_url ?? null,
      notes: isAuction
        ? `Auction: post ~5 days before it closes (${String(e.close_date).slice(0, 10)}). Honest bid-don't-buy framing.`
        : `Fixed-price experience: posting now, limited packages can sell out. Honest bid-vs-redeem framing.`,
    })
  }
  // Adding it is also an editorial review.
  await supabase.from('experience_listings').update({ editorial_reviewed_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin/experiences')
  revalidatePath('/admin/social-calendar')
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
