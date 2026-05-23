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
