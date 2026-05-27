'use server'

import { revalidatePath } from 'next/cache'
import { spawn } from 'node:child_process'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Phase 1 server actions for the per-program Facts tab.
 *
 * `runFactCheck` and `reverifyFact` shell out to scripts/factcheck-program.mjs
 * which does the heavy lifting (extraction + Firecrawl /search + 5-tier rule).
 * Spawned as a background process so the admin request returns immediately;
 * the user reloads the page to see results.
 *
 * `setDisposition` is a direct DB update for editor triage.
 */

/**
 * Kick off a full program fact-check. Spawns the script in the background.
 * The page revalidates so the editor sees "running" state immediately, then
 * polls (or refreshes manually) to see results land.
 */
export async function runFactCheck(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug) return

  // Spawn detached — don't await. Script can take 2-10 min.
  // Output is dropped (best-effort run; logs go to /tmp).
  const child = spawn('node', ['scripts/factcheck-program.mjs', `--slug=${slug}`], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
  })
  child.unref()

  console.log(`[facts] kicked off fact-check for ${slug} (pid ${child.pid})`)
  revalidatePath(`/admin/programs/${slug}/facts`)
}

/**
 * Re-verify a single fact. Spawns the script with --fact-id=<uuid>.
 * On success the script writes a new row with prior_version_id set, supersedes
 * the old one. Editor refreshes to see the new verdict.
 */
export async function reverifyFact(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  // Fetch slug so we can revalidate the right page
  const supabase = createAdminClient()
  const { data: fact } = await supabase
    .from('program_facts')
    .select('program_slug')
    .eq('id', id)
    .maybeSingle()

  const child = spawn('node', ['scripts/factcheck-program.mjs', `--fact-id=${id}`], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
  })
  child.unref()

  console.log(`[facts] kicked off re-verify for fact ${id} (pid ${child.pid})`)
  if (fact?.program_slug) revalidatePath(`/admin/programs/${fact.program_slug}/facts`)
}

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
