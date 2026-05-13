'use server'

import { revalidatePath } from 'next/cache'
import { runAllScrapers, type ScrapeBatchResult } from '@/utils/scraper/runAllScrapers'

/**
 * Server action — runs every scraper config in lib/scrapers/ on
 * demand from the admin Promo Queue page. Same code path as the
 * daily cron, just triggered manually.
 *
 * Returns the structured batch result so the page can render a
 * one-shot summary toast ("3 scrapers ran — 41 new, 0 failed").
 *
 * Auth: action lives inside app/admin/(protected)/, which is
 * gated by middleware. No extra auth check needed here.
 */
export async function runScrapersNowAction(): Promise<ScrapeBatchResult> {
  const result = await runAllScrapers('admin-manual')
  revalidatePath('/admin/promos')
  return result
}
