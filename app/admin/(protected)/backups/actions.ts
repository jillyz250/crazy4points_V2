'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { createSnapshot } from '@/utils/backups/createSnapshot'

/**
 * Server action: take a snapshot now. Triggered by the big button on
 * /admin/backups. Always uses the service-role admin client because we're
 * reading every editorial table and writing to the private bucket.
 */
export async function takeSnapshotNow(formData: FormData): Promise<void> {
  await assertAdmin()
  const label = String(formData.get('label') ?? 'manual').trim() || 'manual'
  const notes = String(formData.get('notes') ?? '').trim() || undefined

  const supabase = createAdminClient()
  const result = await createSnapshot({
    supabase,
    label,
    notes,
    takenBy: 'admin:web',
  })

  if (!result.ok) {
    console.error('[backups] snapshot failed:', result.error)
  } else {
    console.log(
      `[backups] snapshot ${result.snapshotId} → ${result.storagePath} (${(result.sizeBytes / 1024).toFixed(1)} KB, ${result.durationMs}ms)`,
    )
  }

  revalidatePath('/admin/backups')
}

/**
 * Generate a signed URL to download a snapshot file. URLs expire after
 * 5 minutes — long enough for a click, short enough to not leak.
 */
export async function getSnapshotDownloadUrl(storagePath: string): Promise<string | null> {
  await assertAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .storage
    .from('db-backups')
    .createSignedUrl(storagePath, 300)
  if (error) {
    console.error('[backups] signed URL failed:', error.message)
    return null
  }
  return data.signedUrl
}
