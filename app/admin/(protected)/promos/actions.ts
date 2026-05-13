'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/utils/supabase/server'
import { runAllScrapers, type ScrapeBatchResult } from '@/utils/scraper/runAllScrapers'

/**
 * Admin actions for the Promo Queue. Server actions only — never
 * publishes anything unless explicitly invoked. Curator is always
 * the publisher.
 *
 * All routes under app/admin/(protected)/ are gated by middleware;
 * no additional auth check needed here. The reviewed_by field is
 * populated from the authed user's email so we have an audit trail
 * per row.
 */

async function getReviewerEmail(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    return data.user?.email ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Trigger all scrapers immediately. Same code path as the daily cron.
 * Returns the structured batch result so the UI can render a one-shot
 * summary.
 */
export async function runScrapersNowAction(): Promise<ScrapeBatchResult> {
  const result = await runAllScrapers('admin-manual')
  revalidatePath('/admin/promos')
  return result
}

/**
 * Approve a single promo and publish it immediately. The row becomes
 * visible on public surfaces (e.g. /programs/[slug] Active Promos).
 */
export async function approveAndPublishAction(id: string): Promise<void> {
  const reviewerEmail = await getReviewerEmail()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promo_rewards')
    .update({
      admin_status: 'published',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/promos')
}

/**
 * Approve but hold — for batched publishes. Row stays hidden until
 * a follow-up "publish" action.
 */
export async function approveHoldAction(id: string): Promise<void> {
  const reviewerEmail = await getReviewerEmail()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promo_rewards')
    .update({
      admin_status: 'approved',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/promos')
}

/**
 * Publish a previously-held approved row.
 */
export async function publishApprovedAction(id: string): Promise<void> {
  const reviewerEmail = await getReviewerEmail()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promo_rewards')
    .update({
      admin_status: 'published',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('admin_status', 'approved') // guard against race
  if (error) throw error
  revalidatePath('/admin/promos')
}

/**
 * Unpublish — flip published → approved. Use when something slips
 * through that shouldn't have.
 */
export async function unpublishAction(id: string): Promise<void> {
  const reviewerEmail = await getReviewerEmail()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promo_rewards')
    .update({
      admin_status: 'approved',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('admin_status', 'published')
  if (error) throw error
  revalidatePath('/admin/promos')
}

/**
 * Reject. Terminal state — row never reappears in queue even if
 * the scraper sees it again on a future run.
 */
export async function rejectAction(id: string, reason?: string): Promise<void> {
  const reviewerEmail = await getReviewerEmail()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promo_rewards')
    .update({
      admin_status: 'rejected',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason && reason.trim().length > 0 ? reason.trim() : null,
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/promos')
}

/**
 * Ignore — soft-delete. Mistaken scrape or noise the curator doesn't
 * want to keep, but isn't quite a hard reject either. Distinguishes
 * "we considered this and said no thanks" from "this is wrong."
 */
export async function ignoreAction(id: string): Promise<void> {
  const reviewerEmail = await getReviewerEmail()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('promo_rewards')
    .update({
      admin_status: 'ignored',
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/promos')
}

/**
 * Bulk approve + publish — for when a scrape returns lots of rows
 * the curator wants to send live in one click. Each row is updated
 * individually so an audit trail remains per-row.
 */
export async function bulkApproveAndPublishAction(ids: string[]): Promise<{
  succeeded: number
  failed: number
}> {
  if (ids.length === 0) return { succeeded: 0, failed: 0 }
  const reviewerEmail = await getReviewerEmail()
  const supabase = createAdminClient()
  const { error, count } = await supabase
    .from('promo_rewards')
    .update(
      {
        admin_status: 'published',
        reviewed_by: reviewerEmail,
        reviewed_at: new Date().toISOString(),
      },
      { count: 'exact' },
    )
    .in('id', ids)
  if (error) {
    console.error('[bulkApproveAndPublishAction] failed', error)
    return { succeeded: 0, failed: ids.length }
  }
  revalidatePath('/admin/promos')
  return { succeeded: count ?? 0, failed: ids.length - (count ?? 0) }
}
