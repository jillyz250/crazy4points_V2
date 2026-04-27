'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { updateSource } from '@/utils/supabase/queries'
import type { SourceType } from '@/utils/supabase/queries'
import { actionError, isRedirectError, type ActionResult } from '@/lib/admin/actionResult'

export async function updateSourceAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const name = (formData.get('name') as string)?.trim()
    const url = (formData.get('url') as string)?.trim()
    const type = formData.get('type') as SourceType
    const tier = Number(formData.get('tier'))
    const scrape_frequency = (formData.get('scrape_frequency') as string) || 'daily'
    const notes = (formData.get('notes') as string)?.trim() || null
    const use_firecrawl = formData.get('use_firecrawl') === 'on'
    const is_active = formData.get('is_active') === 'on'

    if (!name) return { ok: false, error: 'Name is required.' }
    if (!url) return { ok: false, error: 'URL is required.' }
    if (!type) return { ok: false, error: 'Type is required.' }
    if (!tier || tier < 1 || tier > 5) {
      return { ok: false, error: 'Tier must be between 1 and 5.' }
    }

    const supabase = createAdminClient()
    await updateSource(supabase, id, {
      name,
      url,
      type,
      tier,
      scrape_frequency,
      notes,
      use_firecrawl,
      is_active,
    })
    revalidatePath('/admin/sources')
  } catch (err) {
    if (isRedirectError(err)) throw err
    return actionError(err)
  }
  redirect('/admin/sources')
}
