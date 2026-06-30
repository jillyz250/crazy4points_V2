'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Resolve a program-fact drift conflict. Scout's ingest flagged that a fresh
 * intel item contradicts a stored program page (intel_items.conflict_*). The
 * editor verifies and picks an outcome; the row's conflict_resolution is set so
 * it leaves the drift queue (and the Daily Data Digest's "Program-fact drift").
 *
 * Resolutions mirror the content-ideas ConflictBanner:
 *   false_positive   — detector was wrong; sources actually agree
 *   intel_dismissed  — intel was wrong; also reject the intel item
 *   program_updated  — intel was right; the program page has been fixed
 *   external_verified — checked elsewhere; resolved
 */
const VALID = ['false_positive', 'intel_dismissed', 'program_updated', 'external_verified'] as const

export async function resolveDrift(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const resolution = String(formData.get('resolution') ?? '').trim()
  if (!id || !(VALID as readonly string[]).includes(resolution)) return

  const supabase = createAdminClient()
  const updates: Record<string, unknown> = { conflict_resolution: resolution }
  if (resolution === 'intel_dismissed') updates.rejected_at = new Date().toISOString()

  await supabase.from('intel_items').update(updates).eq('id', id)
  revalidatePath('/admin/program-drift')
}
