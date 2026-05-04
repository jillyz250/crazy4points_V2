'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'

/**
 * Acknowledge a changed scrape: marks the program as verified-today even
 * though the scraped content changed. Use after the user has reviewed the
 * change and either edited the program row or decided no edit is needed.
 *
 * Bumps programs.last_verified to today, which drops the program off the
 * refresh queue for one cadence cycle.
 */
export async function acknowledgeScrapeAction(formData: FormData): Promise<void> {
  const programSlug = String(formData.get('program_slug') ?? '')
  if (!programSlug) return

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  await supabase
    .from('programs')
    .update({ last_verified: today })
    .eq('slug', programSlug)

  revalidatePath('/admin/scrapes')
  revalidatePath('/admin/refresh-queue')
}
