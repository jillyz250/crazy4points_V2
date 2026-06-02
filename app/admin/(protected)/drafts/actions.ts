'use server'

/**
 * Phase 4 v2 — Drafts hub server actions.
 *
 * archiveVariantAction(variantId): generic soft-delete for any variant
 * format. Flips status → 'archived', sets metadata.archive_reason
 * ='manual_delete', and records archived_at + posted_at-style audit.
 *
 * Per the project's "no DELETE — rows stay in DB for audit" rule
 * (Phase 5 lifecycle plan), this never hard-deletes. The row drops out
 * of the active Drafts queue but is recoverable via the Archived chip.
 */
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

export async function archiveVariantAction(
  variantId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminClient()
  const { data: variant } = await supabase
    .from('content_variants')
    .select('id, format, metadata')
    .eq('id', variantId)
    .maybeSingle()
  if (!variant) return { ok: false, error: 'variant not found' }

  const nowIso = new Date().toISOString()
  const newMetadata = {
    ...(variant.metadata as Record<string, unknown> ?? {}),
    archive_reason: 'manual_delete',
    archived_at: nowIso,
  }
  const { error } = await supabase
    .from('content_variants')
    .update({ status: 'archived', archived_at: nowIso, metadata: newMetadata })
    .eq('id', variantId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/drafts')
  return { ok: true }
}

/**
 * Snooze a draft variant to a future date. Hidden from the "Needs review"
 * view until snoozed_until passes; surfaces under the "Snoozed" chip while
 * it waits. Drafts-page side: 1d / 7d / 14d / 30d preset buttons + custom
 * date input (see DraftSnoozeButton).
 */
export async function snoozeVariantAction(formData: FormData): Promise<void> {
  const variantId = String(formData.get('variant_id') ?? '').trim()
  const snoozedUntilRaw = String(formData.get('snoozed_until') ?? '').trim()
  if (!variantId || !snoozedUntilRaw) return
  const snoozedUntil = new Date(snoozedUntilRaw)
  if (Number.isNaN(snoozedUntil.getTime())) return

  const supabase = createAdminClient()
  await supabase
    .from('content_variants')
    .update({ snoozed_until: snoozedUntil.toISOString() })
    .eq('id', variantId)

  revalidatePath('/admin/drafts')
}

/**
 * Reverse a snooze. Surfaces the variant back in "Needs review" immediately.
 */
export async function unsnoozeVariantAction(formData: FormData): Promise<void> {
  const variantId = String(formData.get('variant_id') ?? '').trim()
  if (!variantId) return

  const supabase = createAdminClient()
  await supabase
    .from('content_variants')
    .update({ snoozed_until: null })
    .eq('id', variantId)

  revalidatePath('/admin/drafts')
}
