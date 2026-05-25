'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

export type IssuerUpdate = {
  name: string
  intro: string | null
  website_url: string | null
  logo_url: string | null
  notes: string | null
}

export async function updateIssuerAction(
  slug: string,
  data: IssuerUpdate,
): Promise<{ error?: string }> {
  if (!data.name?.trim()) return { error: 'Name is required.' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('issuers')
    .update({
      name: data.name.trim(),
      intro: data.intro?.trim() || null,
      website_url: data.website_url?.trim() || null,
      logo_url: data.logo_url?.trim() || null,
      notes: data.notes?.trim() || null,
      last_verified: new Date().toISOString().slice(0, 10),
    })
    .eq('slug', slug)

  if (error) return { error: error.message }

  revalidatePath('/admin/issuers')
  revalidatePath(`/admin/issuers/${slug}`)
  return {}
}
