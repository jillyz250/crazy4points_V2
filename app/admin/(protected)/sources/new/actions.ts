'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { createSource } from '@/utils/supabase/queries'
import type { SourceType } from '@/utils/supabase/queries'
import { actionError, isRedirectError, type ActionResult } from '@/lib/admin/actionResult'

const ALLOWED_INTAKE_METHODS = new Set(['scrape', 'email', 'x', 'grok', 'manual'])

export async function createSourceAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = (formData.get('name') as string)?.trim()
    const url = (formData.get('url') as string)?.trim()
    const type = formData.get('type') as SourceType
    const tier = Number(formData.get('tier'))
    const scrape_frequency = (formData.get('scrape_frequency') as string) || 'daily'
    const notes = (formData.get('notes') as string)?.trim() || null
    const use_firecrawl = formData.get('use_firecrawl') === 'on'

    // Phase 2b additions
    const rawIntake = (formData.get('intake_method') as string)?.trim() || 'scrape'
    const intake_method = ALLOWED_INTAKE_METHODS.has(rawIntake) ? rawIntake : 'scrape'
    const rawInbox = (formData.get('inbox_address') as string)?.trim() || ''
    const inbox_address = intake_method === 'email' && rawInbox ? rawInbox.toLowerCase() : null

    if (!name) return { ok: false, error: 'Name is required.' }
    if (!url) return { ok: false, error: 'URL is required.' }
    if (!type) return { ok: false, error: 'Type is required.' }
    if (!tier || tier < 1 || tier > 5) {
      return { ok: false, error: 'Tier must be between 1 and 5.' }
    }
    if (intake_method === 'email') {
      if (!inbox_address || !inbox_address.includes('@')) {
        return { ok: false, error: 'Email intake requires a valid inbox alias.' }
      }
    }

    const supabase = createAdminClient()
    await createSource(supabase, {
      name,
      url,
      type,
      tier,
      scrape_frequency,
      notes,
      use_firecrawl,
      intake_method,
      inbox_address,
    } as Parameters<typeof createSource>[1]) // cast — DB types may not have the new columns in the generated schema yet
  } catch (err) {
    if (isRedirectError(err)) throw err
    return actionError(err)
  }
  redirect('/admin/sources')
}
