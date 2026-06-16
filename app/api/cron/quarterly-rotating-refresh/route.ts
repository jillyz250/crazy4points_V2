/**
 * Quarterly rotating-categories refresh cron.
 *
 * Triggered by Vercel cron on:
 *   - 14:00 UTC on the 15th of Mar/Jun/Sep/Dec (catches issuer announcements
 *     of next quarter's categories ~2 weeks before the new quarter)
 *   - 14:00 UTC on the 1st of Jan/Apr/Jul/Oct (catches the actual quarter
 *     boundary — backup in case the announcement scrape missed something)
 *
 * For each credit_card with rotating_categories_url set, this:
 *   1. Calls extractCardBenefits with the stored URLs (product + guide + rotating)
 *   2. Auto-verify fires as part of extractCardBenefits
 *   3. The new earn rates / benefits land in the DB
 *   4. The public card page picks up the new quarter's categories on next visit
 *
 * Cost: ~$0.15-0.30 per card × ~5 rotating cards (industry-wide) = ~$1-2/quarter
 *
 * Auth: Vercel sets Authorization: Bearer ${CRON_SECRET} when invoking the
 * cron endpoint. We verify that header against process.env.CRON_SECRET.
 * Endpoint is unreachable from outside Vercel's cron infra.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { extractCardBenefits } from '@/utils/cards/extractCardBenefits'
import { assertCron } from '@/lib/auth/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 300  // 5 minutes for multiple sequential card extractions

const JOB_NAME = 'quarterly-rotating-refresh'

export async function GET(request: Request) {
  return handleCron(request)
}

export async function POST(request: Request) {
  return handleCron(request)
}

async function handleCron(request: Request) {
  // Auth — only Vercel cron should reach this endpoint
  const denied = assertCron(request)
  if (denied) return denied

  const supabase = createAdminClient()

  // 1. Insert a "running" row to cron_runs for tracking
  const { data: runRow, error: insertErr } = await supabase
    .from('cron_runs')
    .insert({
      job_name: JOB_NAME,
      status: 'running',
    })
    .select('id')
    .single()

  if (insertErr || !runRow) {
    return NextResponse.json({ ok: false, error: 'Could not record cron run' }, { status: 500 })
  }

  // 2. Find all rotating-category cards
  const { data: cards } = await supabase
    .from('credit_cards')
    .select('id, name, slug, official_url, guide_to_benefits_url, pricing_terms_url, rotating_categories_url')
    .not('rotating_categories_url', 'is', null)
    .eq('is_active', true)

  if (!cards || cards.length === 0) {
    await supabase
      .from('cron_runs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        cards_attempted: 0,
        cards_succeeded: 0,
        cards_failed: 0,
        details: { message: 'No rotating-category cards configured.' },
      })
      .eq('id', runRow.id)
    return NextResponse.json({ ok: true, cards_attempted: 0 })
  }

  // 3. Extract each sequentially (parallel would race on Firecrawl cost limits)
  let succeeded = 0
  let failed = 0
  const perCard: Array<{ slug: string; status: 'success' | 'failed'; error?: string }> = []

  for (const c of cards) {
    if (!c.official_url) {
      failed++
      perCard.push({ slug: c.slug, status: 'failed', error: 'missing official_url' })
      continue
    }
    try {
      const secondaryUrls = [
        c.guide_to_benefits_url as string | null,
        c.pricing_terms_url as string | null,
        c.rotating_categories_url as string | null,
      ].filter((u): u is string => !!u && u.trim().length > 0)

      const r = await extractCardBenefits({
        cardId: c.id,
        cardName: c.name,
        sourceUrl: c.official_url as string,
        interactive: false,
        secondaryUrls: secondaryUrls.length > 0 ? secondaryUrls : undefined,
        skipIfUnchanged: true,  // Cron-only: skip Sonnet if markdown matches last refresh
      })

      if (r.ok) {
        succeeded++
        perCard.push({ slug: c.slug, status: 'success' })
        console.log(`[cron quarterly-rotating-refresh] ${c.slug} OK extraction=${r.extractionId}`)
      } else {
        failed++
        perCard.push({ slug: c.slug, status: 'failed', error: r.error })
        console.error(`[cron quarterly-rotating-refresh] ${c.slug} failed: ${r.error}`)
      }
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      perCard.push({ slug: c.slug, status: 'failed', error: msg })
      console.error(`[cron quarterly-rotating-refresh] ${c.slug} threw: ${msg}`)
    }
  }

  // 4. Finalize the run row
  const finalStatus = failed === 0 ? 'success' : succeeded === 0 ? 'failed' : 'partial'
  await supabase
    .from('cron_runs')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      cards_attempted: cards.length,
      cards_succeeded: succeeded,
      cards_failed: failed,
      details: { per_card: perCard },
    })
    .eq('id', runRow.id)

  return NextResponse.json({
    ok: true,
    job: JOB_NAME,
    cards_attempted: cards.length,
    cards_succeeded: succeeded,
    cards_failed: failed,
    per_card: perCard,
  })
}
