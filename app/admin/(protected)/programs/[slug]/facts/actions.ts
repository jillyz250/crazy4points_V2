'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Phase 1 server actions for the per-program Facts tab.
 *
 * IMPORTANT: the fact-check + re-verify operations run from the CLI, not from
 * the admin UI. Vercel's serverless runtime can't spawn child processes for
 * long-running jobs (5-10 min). Phase 4 of the facts ledger will add proper
 * background queue infrastructure (Vercel cron + a jobs table).
 *
 * For now, the admin UI provides:
 *   - setDisposition: direct DB update for editor triage (works in serverless)
 *
 * Fact-check + re-verify are run from the user's laptop via:
 *   node scripts/factcheck-program.mjs --slug=<slug>
 *   node scripts/factcheck-program.mjs --fact-id=<uuid>
 *
 * The admin page surfaces these as copy-paste CLI commands instead of buttons.
 */

/**
 * Editor triage: set the disposition on a fact.
 * Valid values: auto_locked | kept | reworded | removed | deferred
 * Empty string clears the disposition.
 */
export async function setDisposition(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  const dispositionInput = String(formData.get('disposition') ?? '').trim()
  if (!id) return

  const validDispositions = new Set(['auto_locked', 'kept', 'reworded', 'removed', 'deferred'])
  const disposition = validDispositions.has(dispositionInput) ? dispositionInput : null

  const supabase = createAdminClient()
  const { data: fact } = await supabase
    .from('program_facts')
    .select('program_slug')
    .eq('id', id)
    .maybeSingle()

  await supabase
    .from('program_facts')
    .update({ disposition })
    .eq('id', id)

  if (fact?.program_slug) revalidatePath(`/admin/programs/${fact.program_slug}/facts`)
}
