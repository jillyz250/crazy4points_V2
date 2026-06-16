import { NextResponse } from 'next/server'
import { runAllScrapers } from '@/utils/scraper/runAllScrapers'
import { assertCron } from '@/lib/auth/cron'

/**
 * Daily Vercel Cron endpoint for the Promo Intelligence Engine.
 *
 * Auth: Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Shared loop logic lives in utils/scraper/runAllScrapers.ts — the
 * admin "Run now" action also calls it so both paths produce
 * identical results + observability.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: Request) {
  console.log('[promo-scraper-cron] invoked')

  const denied = assertCron(req)
  if (denied) return denied

  try {
    const result = await runAllScrapers('cron')
    console.log(
      `[promo-scraper-cron] complete — ${result.scraperCount} scrapers, ${result.failed} failed`,
    )
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[promo-scraper-cron] fatal:', message)
    return NextResponse.json({ error: 'fatal', detail: message }, { status: 500 })
  }
}
