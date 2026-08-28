'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'

/** Create a branded short link: /s/<slug> -> target_url. */
export async function createShortLink(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const target_url = String(formData.get('target_url') ?? '').trim()
  const label = String(formData.get('label') ?? '').trim() || null
  if (!slug || !/^https?:\/\//i.test(target_url)) return
  const supabase = createAdminClient()
  await supabase.from('short_links').upsert({ slug, target_url, label }, { onConflict: 'slug' })
  revalidatePath('/admin/short-links')
}

/** Delete a short link. */
export async function deleteShortLink(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('short_links').delete().eq('id', id)
  revalidatePath('/admin/short-links')
}
