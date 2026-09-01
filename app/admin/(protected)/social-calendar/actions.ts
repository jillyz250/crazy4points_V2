'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

const PLATFORMS = ['facebook', 'instagram', 'tiktok'] as const
const STATUSES = ['suggested', 'planned', 'drafted', 'posted', 'skipped'] as const

function touch() {
  return { updated_at: new Date().toISOString() }
}

/** Slide a Recommended (suggested) slot into the definite calendar: suggested -> planned. */
export async function promoteSlot(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const db = createAdminClient()
  await db.from('social_calendar').update({ status: 'planned', ...touch() }).eq('id', id).eq('status', 'suggested')
  revalidatePath('/admin/social-calendar')
}

/** Dismiss a recommended slot (kept for history, out of the way). */
export async function skipSlot(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const db = createAdminClient()
  await db.from('social_calendar').update({ status: 'skipped', ...touch() }).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

/** Advance/set a definite post's status. Marking posted stamps posted_at. */
export async function setStatus(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  if (!id || !(STATUSES as readonly string[]).includes(status)) return
  const db = createAdminClient()
  const patch: Record<string, unknown> = { status, ...touch() }
  patch.posted_at = status === 'posted' ? new Date().toISOString() : null
  await db.from('social_calendar').update(patch).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

/** Move a post to a different date (reschedule). */
export async function moveSlot(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const post_date = String(formData.get('post_date') ?? '').trim()
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(post_date)) return
  const db = createAdminClient()
  await db.from('social_calendar').update({ post_date, ...touch() }).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

/** Add a manual post (lands directly in the definite calendar as planned). */
export async function addManualPost(formData: FormData): Promise<void> {
  await assertAdmin()
  const post_date = String(formData.get('post_date') ?? '').trim()
  const platform = String(formData.get('platform') ?? '').trim()
  const topic = String(formData.get('topic') ?? '').trim()
  const link_url = String(formData.get('link_url') ?? '').trim() || null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post_date) || !(PLATFORMS as readonly string[]).includes(platform) || !topic) return
  const db = createAdminClient()
  await db.from('social_calendar').insert({
    post_date,
    platform,
    topic,
    source_type: 'manual',
    status: 'planned',
    link_url,
  })
  revalidatePath('/admin/social-calendar')
}

/** Save an edited draft body / notes on a post. */
export async function saveDraft(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const draft_body = String(formData.get('draft_body') ?? '')
  const db = createAdminClient()
  const patch: Record<string, unknown> = { draft_body: draft_body || null, ...touch() }
  // First time a draft is written, advance planned -> drafted.
  const { data: row } = await db.from('social_calendar').select('status').eq('id', id).single()
  if (row?.status === 'planned' && draft_body.trim()) patch.status = 'drafted'
  await db.from('social_calendar').update(patch).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

// --- Plain-arg actions for the drag-and-drop board (called from the client) ---

/** Drop a triage card onto a day: schedule it (date + planned) or move a scheduled post. */
export async function scheduleOnDate(id: string, post_date: string): Promise<void> {
  await assertAdmin()
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(post_date)) return
  const db = createAdminClient()
  const { data: row } = await db.from('social_calendar').select('status').eq('id', id).single()
  const patch: Record<string, unknown> = { post_date, ...touch() }
  if (row?.status === 'suggested') patch.status = 'planned' // sliding from Recommended commits it
  await db.from('social_calendar').update(patch).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

/** Send a scheduled post back to the Recommended lane (planned/drafted -> suggested). */
export async function unscheduleById(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()
  await db.from('social_calendar').update({ status: 'suggested', posted_at: null, ...touch() }).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

export async function setPlatformById(id: string, platform: string): Promise<void> {
  await assertAdmin()
  if (!id || !(PLATFORMS as readonly string[]).includes(platform)) return
  const db = createAdminClient()
  await db.from('social_calendar').update({ platform, ...touch() }).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

const CATEGORIES = ['experience', 'sweepstakes', 'sweet_spot', 'program_news', 'deal', 'guide', 'recurring', 'other'] as const
export async function setCategoryById(id: string, category: string): Promise<void> {
  await assertAdmin()
  if (!id || !(CATEGORIES as readonly string[]).includes(category)) return
  const db = createAdminClient()
  await db.from('social_calendar').update({ category, ...touch() }).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

export async function setStatusById(id: string, status: string): Promise<void> {
  await assertAdmin()
  if (!id || !(STATUSES as readonly string[]).includes(status)) return
  const db = createAdminClient()
  const patch: Record<string, unknown> = { status, ...touch() }
  patch.posted_at = status === 'posted' ? new Date().toISOString() : null
  await db.from('social_calendar').update(patch).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

export async function skipById(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()
  await db.from('social_calendar').update({ status: 'skipped', ...touch() }).eq('id', id)
  revalidatePath('/admin/social-calendar')
}

export async function deleteById(id: string): Promise<void> {
  await assertAdmin()
  if (!id) return
  const db = createAdminClient()
  await db.from('social_calendar').delete().eq('id', id)
  revalidatePath('/admin/social-calendar')
}

/** Permanently remove a slot (manual mistakes only). */
export async function deleteSlot(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const db = createAdminClient()
  await db.from('social_calendar').delete().eq('id', id)
  revalidatePath('/admin/social-calendar')
}
