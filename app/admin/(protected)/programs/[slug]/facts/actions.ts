'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Phase 1 server actions for the per-program Facts tab.
 *
 * The fact-check + re-verify operations run from the CLI, not from the admin
 * UI (Vercel's serverless runtime can't spawn long-running child processes).
 * Phase 4 of the facts ledger will add proper background queue infrastructure.
 *
 * For now, the admin UI provides:
 *   - setDisposition: editor triage (disposition + override_reason)
 *
 * Fact-check + re-verify are run from the user's laptop:
 *   node scripts/factcheck-program.mjs --slug=<slug>
 *   node scripts/factcheck-program.mjs --fact-id=<uuid>
 */

export type SetDispositionResult =
  | { ok: true; savedAt: string }
  | { ok: false; error: string }
  | null

const VALID_DISPOSITIONS = new Set(['auto_locked', 'kept', 'reworded', 'removed', 'deferred'])

/**
 * Set disposition + optional override_reason on a fact.
 * Returns a result so the client can render "Saved ✓" feedback via useActionState.
 */
export async function setDisposition(
  _prevState: SetDispositionResult,
  formData: FormData,
): Promise<SetDispositionResult> {
  const id = String(formData.get('id') ?? '').trim()
  const dispositionInput = String(formData.get('disposition') ?? '').trim()
  const overrideReasonInput = String(formData.get('override_reason') ?? '').trim()

  if (!id) return { ok: false, error: 'Missing fact id' }

  const disposition = VALID_DISPOSITIONS.has(dispositionInput) ? dispositionInput : null
  const override_reason = overrideReasonInput.length > 0 ? overrideReasonInput : null

  const supabase = createAdminClient()
  const { data: fact, error: lookupErr } = await supabase
    .from('program_facts')
    .select('program_slug')
    .eq('id', id)
    .maybeSingle()

  if (lookupErr || !fact) {
    return { ok: false, error: lookupErr?.message ?? 'Fact not found' }
  }

  const { error: updErr } = await supabase
    .from('program_facts')
    .update({ disposition, override_reason })
    .eq('id', id)

  if (updErr) return { ok: false, error: updErr.message }

  revalidatePath(`/admin/programs/${fact.program_slug}/facts`)
  return { ok: true, savedAt: new Date().toISOString() }
}
