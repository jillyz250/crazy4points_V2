/**
 * Experiences watch — daily scrape of loyalty "experiences" listings.
 *
 * For each configured program: scrape its experiences page (Firecrawl), parse
 * listings (Haiku), upsert into experience_listings with change detection, mark
 * vanished listings closed, log scraper health, and refresh the public
 * `experiences` directory row's recent_highlights.
 *
 * Phase 1: Wyndham only (internal engine; public Finder deliberately deferred).
 * Review data in /admin/experiences (fast-follow). Schedule: daily (vercel.json).
 * Auth: assertCron (CRON_SECRET).
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { assertCron } from '@/lib/auth/cron'
import { runExperiencesWatch, EXPERIENCE_PROGRAMS } from '@/utils/experiences/runExperiencesWatch'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  return handle(request)
}
export async function POST(request: Request) {
  return handle(request)
}

async function handle(request: Request) {
  const denied = assertCron(request)
  if (denied) return denied
  try {
    const supabase = createAdminClient()
    const results = []
    for (const program of EXPERIENCE_PROGRAMS) {
      try {
        results.push(await runExperiencesWatch(supabase, program))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[experiences-watch] ${program.program_slug} failed:`, message)
        results.push({ program_slug: program.program_slug, success: false, error: message })
      }
    }
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[experiences-watch] failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
